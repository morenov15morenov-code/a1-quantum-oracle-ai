import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePagination, paginationError } from "@/lib/pagination";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  if (!pagination) {
    return NextResponse.json(paginationError(), { status: 400 });
  }

  try {
    const { page, limit, skip } = pagination;
    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.prediction.count(),
    ]);

    return NextResponse.json({
      predictions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin predictions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
