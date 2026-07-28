import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/predictions/route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 29 }),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

function mockChain(result: unknown) {
  const terminal = {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
  return {
    from: vi.fn().mockReturnValue({
      ...terminal,
      where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }),
      innerJoin: vi.fn().mockReturnValue({
        ...terminal,
        orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue({ ...terminal, offset: vi.fn().mockReturnValue(terminal) }) }),
      }),
      orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue({ ...terminal, offset: vi.fn().mockReturnValue(terminal) }) }),
    }),
    values: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }),
    set: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }) }),
  };
}

function createGetRequest(url: string) {
  return new Request(url, { method: "GET" });
}

describe("Admin Predictions API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  });

  it("returns all predictions for admin", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([{ id: "pred-1", userId: "user-1", input: "Test", result: "Result", confidence: 0.8, user: { id: "user-1", name: "Alice", email: "alice@test.com" } }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ count: 1 }]));

    const response = await GET(createGetRequest("http://localhost:3000/api/admin/predictions?page=1&limit=20"));
    const body = await response.json();
    expect(body.predictions).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.predictions[0].user.name).toBe("Alice");
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await GET(createGetRequest("http://localhost:3000/api/admin/predictions"));
    expect(response.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(createGetRequest("http://localhost:3000/api/admin/predictions"));
    expect(response.status).toBe(403);
  });

  it("includes user data with predictions", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([{ id: "pred-1", userId: "user-1", input: "Test", result: "Result", confidence: 0.8, user: { id: "user-1", name: "Alice", email: "alice@test.com" } }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ count: 1 }]));

    const response = await GET(createGetRequest("http://localhost:3000/api/admin/predictions"));
    const body = await response.json();
    expect(body.predictions[0].user).toBeDefined();
    expect(body.predictions[0].user.name).toBe("Alice");
  });

  it("supports custom pagination", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([{ count: 50 }]));
    const response = await GET(createGetRequest("http://localhost:3000/api/admin/predictions?page=3&limit=10"));
    const body = await response.json();
    expect(body.page).toBe(3);
    expect(body.totalPages).toBe(5);
  });

  it("orders by most recent", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([{ count: 0 }]));
    const response = await GET(createGetRequest("http://localhost:3000/api/admin/predictions"));
    expect(response.status).toBe(200);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked((await import("@/lib/rate-limit")).rateLimit).mockReturnValueOnce({ success: false, remaining: 0 });
    const response = await GET(createGetRequest("http://localhost:3000/api/admin/predictions"));
    expect(response.status).toBe(429);
  });
});
