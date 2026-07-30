import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions, subscriptions, analyticsEvents } from "@/lib/schema";
import { queryOracle } from "@/lib/oracle";
import { oracleQuerySchema } from "@/lib/validations";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { parsePagination, paginationError } from "@/lib/pagination";
import { eq, sql } from "drizzle-orm";

async function getOrCreateSubscription(userId: string) {
  let sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  if (!sub) {
    sub = await db.insert(subscriptions).values({ userId }).returning().get();
  }
  if (sub.periodEnd && new Date() > sub.periodEnd) {
    sub = await db.update(subscriptions)
      .set({ predsUsed: 0, periodStart: new Date(), periodEnd: null })
      .where(eq(subscriptions.userId, userId))
      .returning()
      .get();
  }
  return sub;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`predict:${session.user.id}:${ip}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const subscription = await getOrCreateSubscription(session.user.id);

    if (subscription.tier === "FREE" && subscription.predsUsed >= subscription.predsLimit) {
      return NextResponse.json(
        { error: "Free prediction limit reached. Upgrade to Pro for unlimited predictions." },
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
