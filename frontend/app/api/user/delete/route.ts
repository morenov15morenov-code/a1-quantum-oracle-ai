import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, analyticsEvents } from "@/lib/schema";
import { rateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`account-delete:${session.user.id}:${ip}`, 3, 3600000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required to delete your account" }, { status: 400 });
    }

    const user = await db.select().from(users).where(eq(users.id, session.user.id)).get();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Password is incorrect" }, { status: 403 });
    }

    await db.delete(analyticsEvents).where(eq(analyticsEvents.userId, session.user.id)).run();
    await db.delete(users).where(eq(users.id, session.user.id)).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
