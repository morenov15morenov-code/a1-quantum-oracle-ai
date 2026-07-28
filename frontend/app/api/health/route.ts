import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql as drizzleSql } from "drizzle-orm";

export async function GET() {
  try {
    let dbOk = true;
    try {
      await db.all(drizzleSql`SELECT 1`);
    } catch {
      dbOk = false;
    }

    return NextResponse.json({
      status: dbOk ? "ok" : "degraded",
      db: dbOk ? "ok" : "error",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json({ status: "error", db: "error", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
