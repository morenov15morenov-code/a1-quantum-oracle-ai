import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions, subscriptions, analyticsEvents } from "@/lib/schema";
import { oracleQuerySchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { refreshSubscription, nextFreeRefill, isAdminUser } from "@/lib/subscription";
import { eq, sql } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(request: Request) {
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

    const { input, context, domainCategory } = parsed.data;

    if (!input || input.trim().length < 10) {
      return NextResponse.json({ prophecy: "Question must be at least 10 characters." }, { status: 400 });
    }

    let prophecy = "The Oracle is silent.";
    let model = "mock";

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-your-openai-api-key") {
      try {
        const { default: OpenAI } = await import("openai");
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const isLottery = /lotto|lottery|ozlotto|powerball|mega.?millions|jackpot|winning.?numbers?|draw/i.test(input);

        const systemMessage = isLottery
          ? "You are a lottery data analyst. Analyze the question and give your best prediction with specific numbers. Be factual and direct. No mystical language."
          : "You are A1 Quantum Oracle AI — a data-driven prediction engine. Answer directly with specific numbers, dates, and concrete details. No vague spiritual filler. No third-person oracle references. Just answer the question.";

        const userMessage = `Question: ${input}${context ? `\n\nContext: ${context}` : ""}${domainCategory ? `\n\nDomain: ${domainCategory}` : ""}`;

        model = "gpt-4o";
        const result = await client.chat.completions.create({
          model: "gpt-4o",
          max_tokens: 1500,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage },
          ],
        });

        prophecy = result.choices?.[0]?.message?.content || "The Oracle is silent.";
      } catch (aiErr: any) {
        console.error(`[${new Date().toISOString()}] AI_FAILED | INPUT: ${input.substring(0, 200)} | ERROR: ${aiErr?.message || aiErr}`);
        prophecy = `The Oracle encountered a disturbance. (${aiErr?.status || "unknown"}: ${aiErr?.message || "no details"})`;
      }
    } else {
      prophecy = "The Oracle is in mock mode. Set OPENAI_API_KEY for real predictions.";
    }

    try {
      const prediction = await db.insert(predictions).values({
        userId: session.user.id,
        input,
        context: context || null,
        domainCategory: domainCategory || null,
        result: prophecy,
        confidence: 0.5,
        reasoning: "Direct GPT response.",
        model,
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

      return NextResponse.json({ prophecy, id: prediction.id });
    } catch (dbErr: any) {
      console.error(`[${new Date().toISOString()}] DB_FAILED | ERROR: ${dbErr?.message || dbErr}`);
      return NextResponse.json({ prophecy });
    }
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] FATAL | ERROR: ${error?.message || error}`);
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
