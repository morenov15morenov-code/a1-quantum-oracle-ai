import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`reset:${ip}`, Number(process.env.RESET_RATE_LIMIT_MAX) || 3, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const body = await request.json();
    const parsed = requestResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await db.select().from(users).where(eq(users.email, email)).get();

    const successMessage = "If an account exists, a reset link has been sent.";

    if (!user) {
      return NextResponse.json({ message: successMessage });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(rawToken);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.update(users)
      .set({
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
      })
      .where(eq(users.id, user.id))
      .run();

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({ message: successMessage });
  } catch (error) {
    console.error("Request reset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
