import "dotenv/config";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "@/lib/db";

async function main() {
  console.log("Applying Drizzle migrations...");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error("Migration error:", e);
  process.exit(1);
});
