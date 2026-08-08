import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const FREE_PRED_LIMIT = 1;
export const PRO_PRED_LIMIT = 100;
export const FREE_REFILL_MS = 7 * 24 * 60 * 60 * 1000;

export function nextFreeRefill(periodStart: Date | string | null): Date {
  const start = periodStart ? new Date(periodStart) : new Date();
  return new Date(start.getTime() + FREE_REFILL_MS);
}

export function isAdminUser(session: { user?: { role?: string | null; email?: string | null } } | null | undefined): boolean {
  if (session?.user?.role === "ADMIN") return true;
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return false;
  return adminEmails.includes((session?.user?.email ?? "").toLowerCase());
}

export async function refreshSubscription(userId: string) {
  let sub = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).get();
  if (!sub) {
    sub = await db.insert(subscriptions).values({ userId, predsLimit: FREE_PRED_LIMIT }).returning().get();
  }
  const now = new Date();
  const weekElapsed = sub.periodStart && now.getTime() - new Date(sub.periodStart).getTime() >= FREE_REFILL_MS;
  const periodExpired = sub.periodEnd != null && now > new Date(sub.periodEnd);
  if (sub.tier === "FREE") {
    if (weekElapsed || periodExpired) {
      sub = await db.update(subscriptions)
        .set({ predsUsed: 0, predsLimit: FREE_PRED_LIMIT, periodStart: now, periodEnd: null })
        .where(eq(subscriptions.userId, userId))
        .returning()
        .get();
    } else if (sub.predsLimit !== FREE_PRED_LIMIT) {
      sub = await db.update(subscriptions)
        .set({ predsLimit: FREE_PRED_LIMIT })
        .where(eq(subscriptions.userId, userId))
        .returning()
        .get();
    }
  } else if (periodExpired) {
    sub = await db.update(subscriptions)
      .set({ predsUsed: 0, periodStart: now, periodEnd: null })
      .where(eq(subscriptions.userId, userId))
      .returning()
      .get();
  }
  return sub;
}
