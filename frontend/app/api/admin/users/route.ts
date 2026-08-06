import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { adminAction } from "@/lib/protocol7";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`admin-users:${session.user.id}:${ip}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    }).from(users).all();

    return NextResponse.json({ users: allUsers });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`admin-users:${session.user.id}:${ip}`, 30, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const { userId, active, role } = await request.json();

    const hasActive = typeof active === "boolean";
    const hasRole = typeof role === "string" && (role === "USER" || role === "ADMIN");

    if (!userId || (!hasActive && !hasRole)) {
      return NextResponse.json({ error: "userId and active (boolean) and/or role (USER | ADMIN) are required" }, { status: 400 });
    }

    if (userId === session.user.id && (active === false || role === "USER")) {
      return NextResponse.json({ error: "Admin cannot deactivate or demote their own account" }, { status: 400 });
    }

    const target = await db.select().from(users).where(eq(users.id, userId)).get();
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const action = role === "ADMIN" ? "promote_to_admin" : target.role === "ADMIN" && active === false ? "remove_authentication" : "update_user_status";
    const hook = adminAction(action);
    if (!hook.success) {
      return NextResponse.json(
        { error: hook.reason, code: "PROTOCOL7_BLOCKED" },
        { status: 403 }
      );
    }

    const updates: { active?: boolean; role?: string } = {};
    if (hasActive) updates.active = active;
    if (hasRole) updates.role = role;

    const updated = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning()
      .get();

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        active: updated.active,
      },
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
