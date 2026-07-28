import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictions, predictionFeedbacks } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const [{ totalPredictions }] = await db.select({ totalPredictions: sql<number>`count(*)` })
      .from(predictions).where(eq(predictions.userId, userId)).all();

    const [{ totalFeedback }] = await db.select({ totalFeedback: sql<number>`count(*)` })
      .from(predictionFeedbacks).where(eq(predictionFeedbacks.userId, userId)).all();

    const [{ avgRating }] = await db.select({ avgRating: sql<number>`coalesce(avg(${predictionFeedbacks.rating}), 0)` })
      .from(predictionFeedbacks).where(eq(predictionFeedbacks.userId, userId)).all();

    const [{ accurateCount }] = await db.select({ accurateCount: sql<number>`count(*)` })
      .from(predictionFeedbacks)
      .where(sql`${predictionFeedbacks.userId} = ${userId} AND ${predictionFeedbacks.wasAccurate} = 1`)
      .all();

    const [{ totalAccurateFeedback }] = await db.select({ totalAccurateFeedback: sql<number>`count(*)` })
      .from(predictionFeedbacks)
      .where(sql`${predictionFeedbacks.userId} = ${userId} AND ${predictionFeedbacks.wasAccurate} IS NOT NULL`)
      .all();

    const accuracyRate = totalAccurateFeedback > 0 ? accurateCount / totalAccurateFeedback : 0;

    const feedbackByDomain = await db.select({
      domain: predictionFeedbacks.domain,
      count: sql<number>`count(*)`,
    })
      .from(predictionFeedbacks)
      .where(sql`${predictionFeedbacks.userId} = ${userId} AND ${predictionFeedbacks.domain} IS NOT NULL`)
      .groupBy(predictionFeedbacks.domain)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .all();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyFeedback = await db.select({
      rating: predictionFeedbacks.rating,
      createdAt: predictionFeedbacks.createdAt,
    })
      .from(predictionFeedbacks)
      .where(sql`${predictionFeedbacks.userId} = ${userId} AND ${predictionFeedbacks.createdAt} >= ${sixMonthsAgo.getTime()}`)
      .all();

    const ratingsByMonthMap = new Map<string, { total: number; count: number }>();
    for (const fb of monthlyFeedback) {
      const month = new Date(fb.createdAt).toISOString().slice(0, 7);
      const entry = ratingsByMonthMap.get(month) ?? { total: 0, count: 0 };
      entry.total += fb.rating;
      entry.count += 1;
      ratingsByMonthMap.set(month, entry);
    }

    const ratingsByMonth = Array.from(ratingsByMonthMap.entries())
      .map(([month, data]) => ({
        month,
        avgRating: data.total / data.count,
        count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const recentFeedback = await db.select({
      predictionId: predictionFeedbacks.predictionId,
      rating: predictionFeedbacks.rating,
      wasAccurate: predictionFeedbacks.wasAccurate,
      domain: predictionFeedbacks.domain,
      predictionInput: predictions.input,
      predictionConfidence: predictions.confidence,
      predictionCreatedAt: predictions.createdAt,
    })
      .from(predictionFeedbacks)
      .innerJoin(predictions, eq(predictionFeedbacks.predictionId, predictions.id))
      .where(eq(predictionFeedbacks.userId, userId))
      .orderBy(sql`${predictionFeedbacks.createdAt} DESC`)
      .limit(10)
      .all();

    return NextResponse.json({
      totalPredictions,
      totalFeedback,
      avgRating,
      accuracyRate,
      predictionsByDomain: feedbackByDomain.map((d) => ({
        domain: d.domain ?? "Uncategorized",
        count: d.count,
      })),
      ratingsByMonth,
      recentPredictions: recentFeedback.map((fb) => ({
        id: fb.predictionId,
        input: fb.predictionInput,
        confidence: fb.predictionConfidence,
        rating: fb.rating,
        wasAccurate: fb.wasAccurate,
        domain: fb.domain,
        createdAt: fb.predictionCreatedAt,
      })),
    });
  } catch (error) {
    console.error("User analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
