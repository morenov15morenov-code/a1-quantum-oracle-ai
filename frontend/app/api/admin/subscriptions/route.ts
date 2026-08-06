import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, users, analyticsEvents } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { FREE_PRED_LIMIT, PRO_PRED_LIMIT } from "@/lib/subscription";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`admin-subscriptions:${session.user.id}:${ip}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const all = await db.select({
      id: subscriptions.id,
      userId: subscriptions.userId,
      email: users.email,
      name: users.name,
      tier: subscriptions.tier,
      status: subscriptions.status,
      predsUsed: subscriptions.predsUsed,
      predsLimit: subscriptions.predsLimit,
      periodStart: subscriptions.periodStart,
      periodEnd: subscriptions.periodEnd,
    }).from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .all();

    return NextResponse.json({ subscriptions: all });
  } catch (error) {
    console.error("Admin subscriptions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`admin-subscriptions:${session.user.id}:${ip}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const { userId, status } = await request.json();

    if (!userId || !["ACTIVE", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "userId and status (ACTIVE | REJECTED) are required" }, { status: 400 });
    }

    const sub = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .get();

    if (!sub || sub.tier !== "PRO" || sub.status !== "PENDING") {
      return NextResponse.json({ error: "No pending PRO request for this user" }, { status: 400 });
    }

    const updated = await db.update(subscriptions)
      .set({
        status,
        predsLimit: status === "ACTIVE" ? PRO_PRED_LIMIT : FREE_PRED_LIMIT,
        periodStart: status === "ACTIVE" ? new Date() : sub.periodStart,
        periodEnd: null,
      })
      .where(eq(subscriptions.userId, userId))
      .returning()
      .get();

    await db.insert(analyticsEvents).values({
      event: "subscription_approval_changed",
      userId,
      metadata: JSON.stringify({ status, decidedBy: session.user.id }),
    }).run();

    return NextResponse.json({ subscription: updated });
  } catch (error) {
    console.error("Admin subscription PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
