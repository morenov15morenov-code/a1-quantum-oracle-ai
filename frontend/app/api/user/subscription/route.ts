import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions, analyticsEvents } from "@/lib/schema";
import { subscriptionSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

const PRO_PRED_LIMIT = 100;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let subscription = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .get();

    if (!subscription) {
      subscription = await db.insert(subscriptions)
        .values({ userId: session.user.id })
        .returning()
        .get();
    }

    if (subscription.periodEnd && new Date() > subscription.periodEnd) {
      subscription = await db.update(subscriptions)
        .set({ predsUsed: 0, periodStart: new Date(), periodEnd: null })
        .where(eq(subscriptions.userId, session.user.id))
        .returning()
        .get();
    }

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

  try {
    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { tier } = parsed.data;

    const existing = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, session.user.id))
      .get();

    let subscription;
    if (!existing) {
      subscription = await db.insert(subscriptions).values({
        userId: session.user.id,
        tier,
        predsLimit: tier === "PRO" ? PRO_PRED_LIMIT : 5,
        predsUsed: 0,
        periodStart: new Date(),
      }).returning().get();
    } else {
      subscription = await db.update(subscriptions)
        .set({
          tier,
          predsLimit: tier === "PRO" ? PRO_PRED_LIMIT : 5,
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
