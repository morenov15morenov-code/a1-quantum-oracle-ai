import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalUsers, totalPredictions, activeUsers, predictionsByDay, usersByDay, topModels, predictionsByUser] =
    await Promise.all([
      prisma.user.count(),
      prisma.prediction.count(),
      prisma.user.count({ where: { active: true } }),

      prisma.prediction.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
      }),

      prisma.user.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: true,
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

  const avgResult = await prisma.prediction.aggregate({ _avg: { confidence: true } });

  const users = await prisma.user.findMany({
    where: { id: { in: predictionsByUser.map((p: { userId: string }) => p.userId) } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u: { id: string; name: string }) => [u.id, u.name]));

  return NextResponse.json({
    totalUsers,
    totalPredictions,
    activeUsers,
    avgConfidence: avgResult._avg.confidence ?? 0,
    predictionsByDay: predictionsByDay.map((p: { createdAt: Date; _count: number }) => ({
      date: p.createdAt.toISOString().split("T")[0],
      count: p._count,
    })),
    usersByDay: usersByDay.map((u: { createdAt: Date; _count: number }) => ({
      date: u.createdAt.toISOString().split("T")[0],
      count: u._count,
    })),
    topModels: topModels.map((m: { model: string; _count: number }) => ({ model: m.model, count: m._count })),
    predictionsByUser: predictionsByUser.map((p: { userId: string; _count: number }) => ({
      userId: p.userId,
      userName: userMap.get(p.userId) ?? "Unknown",
      count: p._count,
    })),
  });
}
