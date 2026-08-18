import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions, subscriptions, analyticsEvents } from "@/lib/schema";
import { queryOracle } from "@/lib/oracle";
import { oracleQuerySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { refreshSubscription, nextFreeRefill, isAdminUser } from "@/lib/subscription";
import { eq, sql } from "drizzle-orm";

export const maxDuration = 60;

function logFailed(input: string, error: string) {
  console.error(`[${new Date().toISOString()}] FAILED | INPUT: ${input.substring(0, 200)} | ERROR: ${error}`);
}

export async function POST(request: Request) {
  let input = "";
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ prophecy: "Unauthorized." }, { status: 401 });
    }

    const isAdmin = isAdminUser(session);
    if (!isAdmin) {
      const ip = request.headers.get("x-forwarded-for") ?? "unknown";
      const rl = await rateLimit(`predict:${session.user.id}:${ip}`, 10, 60000);
      if (!rl.success) {
        return NextResponse.json({ prophecy: "Too many requests. Wait a moment." }, { status: 429 });
      }
    }

    const subscription = await refreshSubscription(session.user.id);
    if (!isAdmin && (subscription.tier === "FREE" || subscription.status === "PENDING") && subscription.predsUsed >= subscription.predsLimit) {
      const nextRefill = nextFreeRefill(subscription.periodStart);
      const remainingMs = Math.max(0, nextRefill.getTime() - Date.now());
      const days = Math.floor(remainingMs / 86400000);
      const hours = Math.floor((remainingMs % 86400000) / 3600000);
      return NextResponse.json({
        prophecy: subscription.status === "PENDING"
          ? "PRO upgrade is pending approval."
          : `Free limit reached. Next free question in ${days}d ${hours}h. Upgrade to Pro for unlimited.`,
      });
    }

    const body = await request.json();
    const parsed = oracleQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ prophecy: "Invalid input." }, { status: 400 });
    }

    input = parsed.data.input;
    const { context, domainCategory } = parsed.data;

    let oracleResult;
    try {
      oracleResult = await queryOracle({ input, context, domainCategory, userId: session.user.id });
    } catch (e: any) {
      logFailed(input, e?.message || String(e));
      oracleResult = null;
    }

    const prophecy = oracleResult?.result?.trim() || "The Oracle is silent on this matter.";
    const confidence = oracleResult?.confidence ?? 0;
    const reasoning = oracleResult?.reasoning?.trim() || "No reasoning available.";
    const model = oracleResult?.model || (process.env.OPENAI_API_KEY ? "gpt-4o" : "mock");

    let predictionId = "unknown";
    try {
      const prediction = await db.insert(predictions).values({
        userId: session.user.id,
        input,
        context: context || null,
        domainCategory: domainCategory || null,
        result: prophecy,
        confidence,
        reasoning,
        model,
        tokensIn: oracleResult?.tokensIn ?? null,
        tokensOut: oracleResult?.tokensOut ?? null,
      }).returning().get();
      predictionId = prediction.id;

      await db.update(subscriptions)
        .set({ predsUsed: sql`${subscriptions.predsUsed} + 1` })
        .where(eq(subscriptions.userId, session.user.id))
        .run();

      await db.insert(analyticsEvents).values({
        event: "prediction_created",
        userId: session.user.id,
        metadata: JSON.stringify({ predictionId: prediction.id }),
      }).run();
    } catch (dbErr: any) {
      logFailed(input, `DB_ERROR: ${dbErr?.message || dbErr}`);
    }

    return NextResponse.json({
      prophecy,
      confidence,
      reasoning,
      model,
      id: predictionId,
    });
  } catch (error: any) {
    logFailed(input || "unknown", error?.message || String(error));
    return NextResponse.json({
      prophecy: "The Oracle encountered a disturbance in the quantum field.",
    });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ predictions: [], total: 0 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const preds = await db.select().from(predictions)
      .where(eq(predictions.userId, session.user.id))
      .orderBy(sql`${predictions.createdAt} DESC`)
      .limit(limit)
      .offset(skip)
      .all();

    const [{ count: total }] = await db.select({ count: sql<number>`count(*)` })
      .from(predictions)
      .where(eq(predictions.userId, session.user.id))
      .all();

    return NextResponse.json({ predictions: preds, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] GET_FAILED | ERROR: ${error?.message || error}`);
    return NextResponse.json({ predictions: [], total: 0, page: 1, totalPages: 0 });
  }
}
