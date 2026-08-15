import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. For local dev use: file:./data/dev.db\n" +
        "For Turso use: libsql://your-db.turso.io?authToken=your-token"
    );
  }
  const client = createClient({ url });
  if (url.startsWith("file:")) {
    try {
      client.execute("PRAGMA journal_mode = WAL");
      client.execute("PRAGMA busy_timeout = 10000");
    } catch {
      // file DB pragmas are best-effort
    }
  }
  return drizzle(client, { schema });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
