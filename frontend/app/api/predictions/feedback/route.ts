import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions, predictionFeedbacks, analyticsEvents } from "@/lib/schema";
import { feedbackSchema } from "@/lib/validations";
import { rateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`feedback:${session.user.id}:${ip}`, 20, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { predictionId, rating, wasAccurate, comment, domain } = parsed.data;

    const prediction = await db.select().from(predictions).where(eq(predictions.id, predictionId)).get();
    if (!prediction || prediction.userId !== session.user.id) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    const existingFeedback = await db.select().from(predictionFeedbacks)
      .where(eq(predictionFeedbacks.predictionId, predictionId))
      .get();

    let feedback;
    if (existingFeedback) {
      feedback = await db.update(predictionFeedbacks)
        .set({ rating, wasAccurate, comment, domain })
        .where(eq(predictionFeedbacks.predictionId, predictionId))
        .returning()
        .get();
    } else {
      feedback = await db.insert(predictionFeedbacks).values({
        predictionId,
        userId: session.user.id,
        rating,
        wasAccurate,
        comment,
        domain,
      }).returning().get();
    }

    await db.insert(analyticsEvents).values({
      event: "prediction_feedback",
      userId: session.user.id,
      metadata: JSON.stringify({ predictionId, rating, wasAccurate, domain }),
    }).run();

    return NextResponse.json(feedback, {
      status: existingFeedback ? 200 : 201,
      headers: getRateLimitHeaders(20, rl.remaining),
    });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
