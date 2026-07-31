import { createClient, type Client } from "@libsql/client";

let client: Client | undefined;
let tableReady = false;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    });
  }
  return client;
}

async function ensureTable(c: Client): Promise<void> {
  if (tableReady) return;
  await c.execute(`
    CREATE TABLE IF NOT EXISTS RateLimit (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      resetAt INTEGER NOT NULL
    )
  `);
  tableReady = true;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

export async function rateLimit(
  key: string,
  limit = 20,
  windowMs = 60000
): Promise<RateLimitResult> {
  const c = getClient();
  await ensureTable(c);

  const now = Date.now();
  const resetAt = now + windowMs;

  await c.execute({
    sql: `
      INSERT INTO RateLimit (key, count, resetAt) VALUES (?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET
        count = CASE WHEN RateLimit.resetAt <= ? THEN 1 ELSE RateLimit.count + 1 END,
        resetAt = CASE WHEN RateLimit.resetAt <= ? THEN ? ELSE RateLimit.resetAt END
    `,
    args: [key, resetAt, now, now, resetAt],
  });

  const result = await c.execute({
    sql: "SELECT count FROM RateLimit WHERE key = ?",
    args: [key],
  });

  const count = Number(result.rows[0]?.count ?? 0);

  if (count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: Math.max(0, limit - count) };
}

export function getRateLimitHeaders(limit: number, remaining: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
  };
}
