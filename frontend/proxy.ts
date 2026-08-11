import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(key);
  }
}

function checkRateLimit(key: string, limit: number): boolean {
  cleanup();
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

const API_RATE_LIMITS: Record<string, number> = {
  "predictions:POST": 10,
  "predictions:GET": 30,
  "feedback:POST": 20,
  "subscription:POST": 5,
  "user-analytics:GET": 15,
  "profile:PATCH": 10,
  "profile:PUT": 5,
  "admin-analytics:GET": 10,
  "admin-users:GET": 20,
  "admin-predictions:GET": 20,
  default: 30,
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isAdminPage = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");
  const isAdminApiRoute = pathname.startsWith("/api/admin");
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/api/health") ||
    pathname === "/request-reset" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email" ||
    pathname === "/privacy";
  const isAuthApi = pathname.startsWith("/api/auth/");

  if (isPublic) {
    return NextResponse.next();
  }

  if (isAuthApi) {
    if (request.method === "POST") {
      const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
      const key = `auth:${ip}`;
      const authPostLimit = Number(process.env.AUTH_RATE_LIMIT_MAX) || 60;
      if (!checkRateLimit(key, authPostLimit)) {
        return NextResponse.json(
          { error: "Too many requests" },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
    }
    return NextResponse.next();
  }

  let session;
  try {
    session = await auth();
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminApiRoute) {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as { role: string })?.role;
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
    const rateKey = `admin:${pathname}:${request.method}:${session.user.id}:${ip}`;
    if (!checkRateLimit(rateKey, 20)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    return NextResponse.next();
  }

  if (isApiRoute) {
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
    const rateKey = `${pathname}:${request.method}:${session.user.id}:${ip}`;

    let routeLimit = API_RATE_LIMITS.default;
    for (const [pattern, limit] of Object.entries(API_RATE_LIMITS)) {
      if (pathname.includes(pattern.split(":")[0]) && request.method === pattern.split(":")[1]) {
        routeLimit = limit;
        break;
      }
    }

    if (!checkRateLimit(rateKey, routeLimit)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    return NextResponse.next();
  }

  if (!session && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isAuthPage) {
    const role = (session.user as { role: string })?.role;
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isAdminPage && session?.user) {
    const role = (session.user as { role: string })?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};