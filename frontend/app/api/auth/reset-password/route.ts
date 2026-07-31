import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { eq, and, gt } from "drizzle-orm";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`reset-confirm:${ip}`, 5, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    if (password.length < 6 || password.length > 128) {
      return NextResponse.json({ error: "Password must be between 6 and 128 characters" }, { status: 400 });
    }

    if (token.length !== 64) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 400 });
    }

    const hashedToken = hashToken(token);

    const user = await db.select().from(users).where(
      and(
        eq(users.passwordResetToken, hashedToken),
        gt(users.passwordResetExpires, new Date())
      )
    ).get();

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, user.id))
      .run();

    return NextResponse.json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
