import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPOST = vi.fn().mockResolvedValue(new Response("POST ok", { status: 200 }));
const mockGET = vi.fn().mockResolvedValue(new Response("GET ok", { status: 200 }));

vi.mock("@/lib/auth", () => ({
  handlers: {
    GET: mockGET,
    POST: mockPOST,
  },
}));

const mockRateLimit = vi.fn().mockReturnValue({ success: true, remaining: 4 });

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

function createRequest(headers?: Record<string, string>) {
  return new Request("http://localhost:3000/api/auth/csrf", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("NextAuth route handler with rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReturnValue({ success: true, remaining: 4 });
  });

  it("exports GET and POST handlers", async () => {
    const { GET, POST } = await import("@/app/api/auth/[...nextauth]/route");
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
  });

  it("GET returns response from auth handler", async () => {
    const { GET } = await import("@/app/api/auth/[...nextauth]/route");
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it("POST delegates to auth handler when rate limit allows", async () => {
    const { POST } = await import("@/app/api/auth/[...nextauth]/route");
    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(mockPOST).toHaveBeenCalled();
  });

  it("POST returns 429 when rate limit exceeded", async () => {
    mockRateLimit.mockReturnValue({ success: false, remaining: 0 });
    const { POST } = await import("@/app/api/auth/[...nextauth]/route");
    const response = await POST(createRequest());
    expect(response.status).toBe(429);
    expect(mockPOST).not.toHaveBeenCalled();
  });

  it("POST uses IP from x-forwarded-for header", async () => {
    const { POST } = await import("@/app/api/auth/[...nextauth]/route");
    await POST(createRequest({ "x-forwarded-for": "1.2.3.4" }));
    expect(mockRateLimit).toHaveBeenCalledWith("login:1.2.3.4", 5, 60000);
  });

  it("POST uses 'unknown' when no x-forwarded-for header", async () => {
    const { POST } = await import("@/app/api/auth/[...nextauth]/route");
    await POST(createRequest());
    expect(mockRateLimit).toHaveBeenCalledWith("login:unknown", 5, 60000);
  });
});
