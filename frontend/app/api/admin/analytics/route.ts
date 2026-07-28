import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, predictions } from "@/lib/schema";
import { rateLimit } from "@/lib/rate-limit";
import { eq, sql, gte } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`admin-analytics:${session.user.id}:${ip}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(users).all();
    const [{ totalPredictions }] = await db.select({ totalPredictions: sql<number>`count(*)` }).from(predictions).all();
    const [{ activeUsers }] = await db.select({ activeUsers: sql<number>`count(*)` }).from(users).where(eq(users.active, true)).all();
    const [{ avgConfidence }] = await db.select({ avgConfidence: sql<number>`coalesce(avg(${predictions.confidence}), 0)` }).from(predictions).all();

    const recentPredictions = await db.select({ createdAt: predictions.createdAt })
      .from(predictions)
      .where(gte(predictions.createdAt, new Date(thirtyDaysAgo)))
      .all();

    const recentUsers = await db.select({ createdAt: users.createdAt })
      .from(users)
      .where(gte(users.createdAt, new Date(thirtyDaysAgo)))
      .all();

    const topModels = await db.select({ model: predictions.model, count: sql<number>`count(*)` })
      .from(predictions)
      .groupBy(predictions.model)
      .orderBy(sql`count(*) DESC`)
      .limit(5)
      .all();

    const predictionsByUser = await db.select({ userId: predictions.userId, count: sql<number>`count(*)` })
      .from(predictions)
      .groupBy(predictions.userId)
      .orderBy(sql`count(*) DESC`)
      .limit(10)
      .all();

    const predictionsByDayMap = new Map<string, number>();
    for (const p of recentPredictions) {
      const date = new Date(p.createdAt).toISOString().split("T")[0];
      predictionsByDayMap.set(date, (predictionsByDayMap.get(date) ?? 0) + 1);
    }

    const usersByDayMap = new Map<string, number>();
    for (const u of recentUsers) {
      const date = new Date(u.createdAt).toISOString().split("T")[0];
      usersByDayMap.set(date, (usersByDayMap.get(date) ?? 0) + 1);
    }

    const userIds = predictionsByUser.map((p) => p.userId);
    const userNames = userIds.length > 0
      ? await db.select({ id: users.id, name: users.name }).from(users).where(sql`${users.id} IN (${sql.join(userIds.map((id) => sql`${id}`), sql`, `)})`).all()
      : [];
    const userMap = new Map(userNames.map((u) => [u.id, u.name]));

    return NextResponse.json({
      totalUsers,
      totalPredictions,
      activeUsers,
      avgConfidence,
      predictionsByDay: Array.from(predictionsByDayMap.entries()).map(([date, count]) => ({ date, count })),
      usersByDay: Array.from(usersByDayMap.entries()).map(([date, count]) => ({ date, count })),
      topModels: topModels.map((m) => ({ model: m.model, count: m.count })),
      predictionsByUser: predictionsByUser.map((p) => ({
        userId: p.userId,
        userName: userMap.get(p.userId) ?? "Unknown",
        count: p.count,
      })),
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
