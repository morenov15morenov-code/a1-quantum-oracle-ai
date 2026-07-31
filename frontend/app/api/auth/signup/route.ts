import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, analyticsEvents } from "@/lib/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { signupServerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail, sendVerificationEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const VERIFICATION_REQUIRED = process.env.EMAIL_VERIFICATION_REQUIRED === "true";
const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`signup:${ip}`, Number(process.env.SIGNUP_RATE_LIMIT_MAX) || 3, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const body = await request.json();
    const parsed = signupServerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 12);

    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).get();
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    let emailVerified: Date | null = new Date();
    let emailVerifyToken: string | null = null;
    let emailVerifyExpires: Date | null = null;

    if (VERIFICATION_REQUIRED) {
      emailVerified = null;
      const rawToken = crypto.randomBytes(32).toString("hex");
      emailVerifyToken = hashToken(rawToken);
      emailVerifyExpires = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS);

      const user = await db.insert(users).values({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: null,
        emailVerifyToken,
        emailVerifyExpires,
      }).returning().get();

      await db.insert(analyticsEvents).values({ event: "user_signup", userId: user.id }).run();

      const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
      sendVerificationEmail(user.email, verifyUrl).catch(() => {});

      return NextResponse.json(
        { id: user.id, name: user.name, email: user.email, message: "Please verify your email to activate your account." },
        { status: 201 }
      );
    }

    const user = await db.insert(users).values({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      emailVerified,
      emailVerifyToken,
      emailVerifyExpires,
    }).returning().get();

    await db.insert(analyticsEvents).values({ event: "user_signup", userId: user.id }).run();

    sendWelcomeEmail(user.email, user.name).catch(() => {});

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
