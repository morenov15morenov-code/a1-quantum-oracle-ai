import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions, subscriptions, analyticsEvents } from "@/lib/schema";
import { queryOracle } from "@/lib/oracle";
import { oracleQuerySchema } from "@/lib/validations";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { refreshSubscription, nextFreeRefill, isAdminUser } from "@/lib/subscription";
import { parsePagination, paginationError } from "@/lib/pagination";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`predict:${session.user.id}:${ip}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const subscription = await refreshSubscription(session.user.id);

    const isAdmin = isAdminUser(session);

    if (process.env.EMAIL_VERIFICATION_REQUIRED === "true" && !session.user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before making predictions. Check your inbox for the verification link." },
        { status: 403 }
      );
    }

    if (!isAdmin && (subscription.tier === "FREE" || subscription.status === "PENDING") && subscription.predsUsed >= subscription.predsLimit) {
      const pendingApproval = subscription.status === "PENDING";
      const nextRefill = nextFreeRefill(subscription.periodStart);
      const remainingMs = Math.max(0, nextRefill.getTime() - Date.now());
      const days = Math.floor(remainingMs / 86400000);
      const hours = Math.floor((remainingMs % 86400000) / 3600000);
      return NextResponse.json(
        {
          error: pendingApproval
            ? "PRO upgrade is pending approval. You have reached the free prediction limit."
            : `Free prediction limit reached. Your next free question unlocks in ${days}d ${hours}h. Upgrade to Pro for unlimited predictions.`,
          nextFreeInMs: remainingMs,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = oracleQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { input, context, domainCategory } = parsed.data;
    const oracleResult = await queryOracle({ input, context, domainCategory });

    const prediction = await db.insert(predictions).values({
      userId: session.user.id,
      input,
      context: context || null,
      domainCategory: domainCategory || null,
      result: oracleResult.result,
      confidence: oracleResult.confidence,
      reasoning: oracleResult.reasoning,
      model: process.env.OPENAI_API_KEY ? "gpt-4o" : "mock",
      tokensIn: oracleResult.tokensIn ?? null,
      tokensOut: oracleResult.tokensOut ?? null,
    }).returning().get();

    await db.update(subscriptions)
      .set({ predsUsed: sql`${subscriptions.predsUsed} + 1` })
      .where(eq(subscriptions.userId, session.user.id))
      .run();

    await db.insert(analyticsEvents).values({
      event: "prediction_created",
      userId: session.user.id,
      metadata: JSON.stringify({ predictionId: prediction.id }),
    }).run();

    return NextResponse.json(prediction, {
      status: 201,
      headers: getRateLimitHeaders(10, rl.remaining),
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  if (!pagination) {
    return NextResponse.json(paginationError(), { status: 400 });
  }

  try {
    const { page, limit, skip } = pagination;

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
  } catch (error) {
    console.error("Predictions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
