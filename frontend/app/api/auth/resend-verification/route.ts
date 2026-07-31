import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import { eq } from "drizzle-orm";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`resend-verification:${ip}`, 3, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const genericMessage = "If an account exists and is unverified, a new verification email has been sent.";

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user || user.emailVerified) {
      return NextResponse.json({ message: genericMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.update(users)
      .set({ emailVerifyToken: hashedToken, emailVerifyExpires: expires })
      .where(eq(users.id, user.id))
      .run();

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;

    sendVerificationEmail(user.email, verifyUrl).catch(() => {});

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
