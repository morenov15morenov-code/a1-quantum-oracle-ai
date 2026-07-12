import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalPredictions, activeUsers, avgResult] = await Promise.all([
      prisma.user.count(),
      prisma.prediction.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.prediction.aggregate({ _avg: { confidence: true } }),
    ]);

    const avgConfidence = avgResult._avg.confidence ?? 0;

    const [recentPredictions, recentUsers, topModels, predictionsByUser] = await Promise.all([
      prisma.prediction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.prediction.groupBy({
        by: ["model"],
        _count: true,
        orderBy: { _count: { model: "desc" } },
        take: 5,
      }),
      prisma.prediction.groupBy({
        by: ["userId"],
        _count: true,
        orderBy: { _count: { userId: "desc" } },
        take: 10,
      }),
    ]);

    const predictionsByDayMap = new Map<string, number>();
    for (const p of recentPredictions) {
      const date = p.createdAt.toISOString().split("T")[0];
      predictionsByDayMap.set(date, (predictionsByDayMap.get(date) ?? 0) + 1);
    }

    const usersByDayMap = new Map<string, number>();
    for (const u of recentUsers) {
      const date = u.createdAt.toISOString().split("T")[0];
      usersByDayMap.set(date, (usersByDayMap.get(date) ?? 0) + 1);
    }

    const users = await prisma.user.findMany({
      where: { id: { in: predictionsByUser.map((p: { userId: string }) => p.userId) } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u: { id: string; name: string }) => [u.id, u.name]));

    return NextResponse.json({
      totalUsers,
      totalPredictions,
      activeUsers,
      avgConfidence,
      predictionsByDay: Array.from(predictionsByDayMap.entries()).map(([date, count]) => ({ date, count })),
      usersByDay: Array.from(usersByDayMap.entries()).map(([date, count]) => ({ date, count })),
      topModels: topModels.map((m: { model: string; _count: number }) => ({ model: m.model, count: m._count })),
      predictionsByUser: predictionsByUser.map((p: { userId: string; _count: number }) => ({
        userId: p.userId,
        userName: userMap.get(p.userId) ?? "Unknown",
        count: p._count,
      })),
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
