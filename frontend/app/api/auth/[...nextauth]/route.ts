import { handlers } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const GET = handlers.GET;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimit(`login:${ip}`, Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5, 60000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return (handlers.POST as (request: Request) => Promise<Response>)(request);
}
