import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { predictions, users } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { parsePagination, paginationError } from "@/lib/pagination";
import { rateLimit } from "@/lib/rate-limit";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`admin-predictions:${session.user.id}:${ip}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  const { searchParams } = new URL(request.url);
  const pagination = parsePagination(searchParams);
  if (!pagination) {
    return NextResponse.json(paginationError(), { status: 400 });
  }

  try {
    const { page, limit, skip } = pagination;

    const rows = await db.select({
      id: predictions.id,
      userId: predictions.userId,
      input: predictions.input,
      result: predictions.result,
      confidence: predictions.confidence,
      reasoning: predictions.reasoning,
      model: predictions.model,
      tokensIn: predictions.tokensIn,
      tokensOut: predictions.tokensOut,
      createdAt: predictions.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
      .from(predictions)
      .innerJoin(users, eq(predictions.userId, users.id))
      .orderBy(sql`${predictions.createdAt} DESC`)
      .limit(limit)
      .offset(skip)
      .all();

    const [{ count: total }] = await db.select({ count: sql<number>`count(*)` }).from(predictions).all();

    return NextResponse.json({
      predictions: rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin predictions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
