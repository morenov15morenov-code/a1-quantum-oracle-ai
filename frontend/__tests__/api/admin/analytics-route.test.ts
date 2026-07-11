import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/analytics/route";

const mockAuth = vi.fn();
const mockUserCount = vi.fn();
const mockPredictionCount = vi.fn();
const mockPredictionGroupBy = vi.fn();
const mockUserGroupBy = vi.fn();
const mockPredictionAggregate = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      count: (...args: unknown[]) => mockUserCount(...args),
      groupBy: (...args: unknown[]) => mockUserGroupBy(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    prediction: {
      count: (...args: unknown[]) => mockPredictionCount(...args),
      groupBy: (...args: unknown[]) => mockPredictionGroupBy(...args),
      aggregate: (...args: unknown[]) => mockPredictionAggregate(...args),
    },
  },
}));

describe("Admin Analytics API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });

    mockUserCount.mockResolvedValue(50);
    mockPredictionCount.mockResolvedValue(200);
    mockPredictionGroupBy.mockResolvedValue([]);
    mockUserGroupBy.mockResolvedValue([]);
    mockPredictionAggregate.mockResolvedValue({ _avg: { confidence: 0.72 } });
    mockUserFindMany.mockResolvedValue([]);
  });

  it("returns analytics data for admin", async () => {
    mockUserCount.mockResolvedValueOnce(50).mockResolvedValueOnce(40);

    const response = await GET();
    const body = await response.json();

    expect(body.totalUsers).toBe(50);
    expect(body.totalPredictions).toBe(200);
    expect(body.activeUsers).toBe(40);
    expect(body.avgConfidence).toBe(0.72);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("returns empty arrays when no data", async () => {
    mockUserCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    const response = await GET();
    const body = await response.json();

    expect(body.predictionsByDay).toEqual([]);
    expect(body.usersByDay).toEqual([]);
    expect(body.topModels).toEqual([]);
    expect(body.predictionsByUser).toEqual([]);
  });

  it("returns formatted chart data", async () => {
    const now = new Date();
    mockUserCount.mockResolvedValueOnce(50).mockResolvedValueOnce(40);
    mockPredictionGroupBy
      .mockResolvedValueOnce([
        { createdAt: now, _count: 5 },
      ])
      .mockResolvedValueOnce([
        { model: "gpt-4o", _count: 10 },
      ])
      .mockResolvedValueOnce([
        { userId: "u1", _count: 8 },
      ]);
    mockUserGroupBy
      .mockResolvedValueOnce([
        { createdAt: now, _count: 2 },
      ]);
    mockUserFindMany.mockResolvedValue([
      { id: "u1", name: "Alice" },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(body.predictionsByDay[0].count).toBe(5);
    expect(body.usersByDay[0].count).toBe(2);
    expect(body.topModels[0].model).toBe("gpt-4o");
    expect(body.predictionsByUser[0].userName).toBe("Alice");
  });

  it("resolves unknown users", async () => {
    mockUserCount.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    mockPredictionGroupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { userId: "nonexistent", _count: 3 },
      ]);
    mockUserGroupBy.mockResolvedValueOnce([]);
    mockUserFindMany.mockResolvedValue([]);

    const response = await GET();
    const body = await response.json();
    expect(body.predictionsByUser[0].userName).toBe("Unknown");
  });
});
