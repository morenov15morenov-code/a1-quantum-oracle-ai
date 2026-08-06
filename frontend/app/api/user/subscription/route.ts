import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions, analyticsEvents } from "@/lib/schema";
import { subscriptionSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { FREE_PRED_LIMIT, PRO_PRED_LIMIT, refreshSubscription } from "@/lib/subscription";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await refreshSubscription(session.user.id);

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Subscription GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`subscription:${session.user.id}:${ip}`, 5, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { tier } = parsed.data;

    if (tier === "PRO" && process.env.PAYMENT_GATE_ENABLED === "true" && !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment processing not configured. PRO upgrade requires a payment method." },
        { status: 402 }
      );
    }

    const needsApproval = tier === "PRO" && process.env.ADMIN_APPROVAL_REQUIRED === "true";
    const status = needsApproval ? "PENDING" : "ACTIVE";
    const predsLimit = tier === "PRO" && status === "ACTIVE" ? PRO_PRED_LIMIT : FREE_PRED_LIMIT;

    const existing = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .get();

    let subscription;
    if (!existing) {
      subscription = await db.insert(subscriptions).values({
        userId: session.user.id,
        tier,
        status,
        predsLimit,
        predsUsed: 0,
        periodStart: new Date(),
      }).returning().get();
    } else {
      subscription = await db.update(subscriptions)
        .set({
          tier,
          status,
          predsLimit,
          periodStart: new Date(),
          periodEnd: null,
        })
        .where(eq(subscriptions.userId, session.user.id))
        .returning()
        .get();
    }

    await db.insert(analyticsEvents).values({
      event: "subscription_changed",
      userId: session.user.id,
      metadata: JSON.stringify({ tier }),
    }).run();

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("Subscription POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
