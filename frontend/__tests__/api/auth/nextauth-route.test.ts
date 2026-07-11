import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  handlers: {
    GET: vi.fn().mockResolvedValue(new Response("GET ok", { status: 200 })),
    POST: vi.fn().mockResolvedValue(new Response("POST ok", { status: 200 })),
  },
}));

describe("NextAuth route handler", () => {
  it("exports GET and POST handlers", async () => {
    const { GET, POST } = await import("@/app/api/auth/[...nextauth]/route");
    expect(GET).toBeDefined();
    expect(POST).toBeDefined();
  });

  it("GET returns response from auth handler", async () => {
    const { GET } = await import("@/app/api/auth/[...nextauth]/route");
    const response = await GET();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe("GET ok");
  });

  it("POST returns response from auth handler", async () => {
    const { POST } = await import("@/app/api/auth/[...nextauth]/route");
    const response = await POST();
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe("POST ok");
  });

  it("delegates to auth handlers", async () => {
    const handlers = await import("@/lib/auth");
    const { GET } = await import("@/app/api/auth/[...nextauth]/route");
    await GET();
    expect(handlers.handlers.GET).toHaveBeenCalled();
  });
});
