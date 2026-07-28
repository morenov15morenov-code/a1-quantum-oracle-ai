import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/analytics/route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 9 }),
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
      where: vi.fn().mockReturnValue({
        ...terminal,
        groupBy: vi.fn().mockReturnValue({ ...terminal, orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }) }),
      }),
      groupBy: vi.fn().mockReturnValue({ ...terminal, orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }) }),
      orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }),
    }),
    values: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }),
    set: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }) }),
  };
}

function createGetRequest() {
  return new Request("http://localhost:3000/api/admin/analytics", { method: "GET" });
}

describe("Admin Analytics API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  });

  it("returns analytics data for admin", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([{ totalUsers: 50 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ totalPredictions: 200 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ activeUsers: 40 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ avgConfidence: 0.72 }]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));

    const response = await GET(createGetRequest());
    const body = await response.json();
    expect(body.totalUsers).toBe(50);
    expect(body.totalPredictions).toBe(200);
    expect(body.activeUsers).toBe(40);
    expect(body.avgConfidence).toBe(0.72);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await GET(createGetRequest());
    expect(response.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(createGetRequest());
    expect(response.status).toBe(403);
  });

  it("returns empty arrays when no data", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([{ totalUsers: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ totalPredictions: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ activeUsers: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ avgConfidence: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));

    const response = await GET(createGetRequest());
    const body = await response.json();
    expect(body.predictionsByDay).toEqual([]);
    expect(body.usersByDay).toEqual([]);
    expect(body.topModels).toEqual([]);
    expect(body.predictionsByUser).toEqual([]);
  });

  it("returns formatted chart data", async () => {
    const now = new Date();
    dbMock.select.mockReturnValueOnce(mockChain([{ totalUsers: 50 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ totalPredictions: 200 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ activeUsers: 40 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ avgConfidence: 0.72 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ createdAt: now }, { createdAt: now }, { createdAt: new Date(now.getTime() - 86400000) }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ createdAt: now }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ model: "gpt-4o", count: 10 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ userId: "u1", count: 8 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ id: "u1", name: "Alice" }]));

    const response = await GET(createGetRequest());
    const body = await response.json();
    expect(body.predictionsByDay.length).toBeGreaterThan(0);
    expect(body.usersByDay.length).toBeGreaterThan(0);
    expect(body.topModels[0].model).toBe("gpt-4o");
    expect(body.predictionsByUser[0].userName).toBe("Alice");
  });

  it("resolves unknown users", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([{ totalUsers: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ totalPredictions: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ activeUsers: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([{ avgConfidence: 0 }]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([]));
    dbMock.select.mockReturnValueOnce(mockChain([{ userId: "nonexistent", count: 3 }]));
    dbMock.select.mockReturnValueOnce(mockChain([]));

    const response = await GET(createGetRequest());
    const body = await response.json();
    expect(body.predictionsByUser[0].userName).toBe("Unknown");
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked((await import("@/lib/rate-limit")).rateLimit).mockReturnValueOnce({ success: false, remaining: 0 });
    const response = await GET(createGetRequest());
    expect(response.status).toBe(429);
  });
});
