import { createClient } from "@libsql/client";

const client = createClient({ url: "file:./data/dev.db" });

async function main() {
  console.log("Migrating schema...");

  const migrations = [
    'ALTER TABLE "Prediction" ADD COLUMN "shareSlug" TEXT',
    'CREATE UNIQUE INDEX IF NOT EXISTS "Prediction_shareSlug_idx" ON "Prediction"("shareSlug")',
    `CREATE TABLE IF NOT EXISTS "RateLimit" (
      "key" TEXT PRIMARY KEY,
      "count" INTEGER NOT NULL,
      "resetAt" INTEGER NOT NULL
    )`,
    'ALTER TABLE "Subscription" ADD COLUMN "status" TEXT NOT NULL DEFAULT "ACTIVE"',
    'ALTER TABLE "User" ADD COLUMN "emailVerifyToken" TEXT',
    'ALTER TABLE "User" ADD COLUMN "emailVerifyExpires" INTEGER',
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
      console.log(`  OK: ${sql.substring(0, 60)}...`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("duplicate column") || msg.includes("already exists")) {
        console.log(`  SKIP: ${sql.substring(0, 60)}...`);
      } else {
        console.error(`  FAIL: ${sql.substring(0, 60)}...`);
        console.error(`    ${msg}`);
      }
    }
  }

  console.log("Migration complete.");
}

main().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
