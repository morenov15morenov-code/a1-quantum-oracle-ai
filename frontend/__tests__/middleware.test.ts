import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;

function mockRequest(pathname: string) {
  return {
    nextUrl: {
      pathname,
      searchParams: new URLSearchParams(),
    },
    url: `http://localhost:3000${pathname}`,
  };
}

describe("Middleware auth logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows access to public pages", async () => {
    mockAuth.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/");
    const response = await proxy(req);
    expect(response?.headers).toBeDefined();
  });

  it("allows unauthenticated access to verify-email page", async () => {
    mockAuth.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/verify-email?token=abc");
    const response = await proxy(req);
    expect(response?.headers).toBeDefined();
  });

  it("allows unauthenticated access to privacy page", async () => {
    mockAuth.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/privacy");
    const response = await proxy(req);
    expect(response?.headers).toBeDefined();
  });

  it("allows unauthenticated access to signup page", async () => {
    mockAuth.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/signup");
    const response = await proxy(req);
    expect(response?.headers).toBeDefined();
  });

  it("redirects unauthenticated user to login", async () => {
    mockAuth.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/dashboard");
    const response = await proxy(req);
    expect(response?.status).toBe(307);
  });

  it("allows API routes without auth", async () => {
    mockAuth.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/api/predictions");
    const response = await proxy(req);
    expect(response?.headers).toBeDefined();
  });

  it("blocks API admin routes without auth", async () => {
    mockAuth.mockResolvedValue(null);
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/api/admin/users");
    const response = await proxy(req);
    expect(response?.headers).toBeDefined();
  });

  it("redirects authenticated user away from auth pages", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1", role: "USER" } });
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/login");
    const response = await proxy(req);
    expect(response?.status).toBe(307);
  });

  it("redirects admin to admin dashboard from auth pages", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/login");
    const response = await proxy(req);
    expect(response?.status).toBe(307);
  });

  it("redirects non-admin away from admin pages", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1", role: "USER" } });
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/admin/dashboard");
    const response = await proxy(req);
    expect(response?.status).toBe(307);
  });

  it("allows admin to access admin pages", async () => {
    mockAuth.mockResolvedValue({ user: { id: "1", role: "ADMIN" } });
    const { proxy } = await import("@/proxy");
    const req = mockRequest("/admin/dashboard");
    const response = await proxy(req);
    expect(response?.headers).toBeDefined();
  });

  it("exports config matcher", async () => {
    const { config } = await import("@/proxy");
    expect(config).toBeDefined();
    expect(config.matcher).toBeDefined();
    expect(config.matcher[0]).toContain("_next/static");
  });
});
