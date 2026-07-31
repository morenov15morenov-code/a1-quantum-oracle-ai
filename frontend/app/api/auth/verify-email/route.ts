import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { eq, and, gt } from "drizzle-orm";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`verify-email:${ip}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const { token } = await request.json();
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      return NextResponse.json({ error: "Invalid verification token" }, { status: 400 });
    }

    const hashedToken = hashToken(token);

    const user = await db.select().from(users).where(
      and(
        eq(users.emailVerifyToken, hashedToken),
        gt(users.emailVerifyExpires, new Date())
      )
    ).get();

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    await db.update(users)
      .set({
        emailVerified: new Date(),
        emailVerifyToken: null,
        emailVerifyExpires: null,
      })
      .where(eq(users.id, user.id))
      .run();

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
