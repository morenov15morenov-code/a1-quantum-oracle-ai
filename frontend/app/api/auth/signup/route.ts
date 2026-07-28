import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, analyticsEvents } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/email";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = rateLimit(`signup:${ip}`, Number(process.env.SIGNUP_RATE_LIMIT_MAX) || 3, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
  }

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
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

    const user = await db.insert(users).values({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    }).returning().get();

    await db.insert(analyticsEvents).values({ event: "user_signup", userId: user.id }).run();

    sendWelcomeEmail(user.email, user.name).catch(() => {});

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
