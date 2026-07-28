import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/user/analytics/route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

function chain(result: unknown) {
  const terminal = {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
  const whereResult = {
    ...terminal,
    orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }),
    groupBy: vi.fn().mockReturnValue({ ...terminal, orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }) }),
    innerJoin: vi.fn().mockReturnValue({ ...terminal, orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }) }),
    leftJoin: vi.fn().mockReturnValue(terminal),
  };
  return {
    from: vi.fn().mockReturnValue({
      ...terminal,
      where: vi.fn().mockReturnValue(whereResult),
    innerJoin: vi.fn().mockReturnValue({
      ...terminal,
      where: vi.fn().mockReturnValue(whereResult),
      orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }),
    }),
      orderBy: vi.fn().mockReturnValue({ ...terminal, limit: vi.fn().mockReturnValue(terminal) }),
    }),
    values: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }),
    set: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }) }),
  };
}

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;

describe("User Analytics API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns analytics data", async () => {
    dbMock.select
      .mockReturnValueOnce(chain([{ totalPredictions: 10 }]))
      .mockReturnValueOnce(chain([{ totalFeedback: 5 }]))
      .mockReturnValueOnce(chain([{ avgRating: 4.2 }]))
      .mockReturnValueOnce(chain([{ accurateCount: 3 }]))
      .mockReturnValueOnce(chain([{ totalAccurateFeedback: 4 }]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]));

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.totalPredictions).toBe(10);
    expect(body.totalFeedback).toBe(5);
    expect(body.avgRating).toBe(4.2);
  });

  it("calculates accuracy rate", async () => {
    dbMock.select
      .mockReturnValueOnce(chain([{ totalPredictions: 10 }]))
      .mockReturnValueOnce(chain([{ totalFeedback: 5 }]))
      .mockReturnValueOnce(chain([{ avgRating: 4.2 }]))
      .mockReturnValueOnce(chain([{ accurateCount: 3 }]))
      .mockReturnValueOnce(chain([{ totalAccurateFeedback: 4 }]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]));

    const response = await GET();
    const body = await response.json();
    expect(body.accuracyRate).toBeCloseTo(0.75);
  });

  it("returns domain breakdown", async () => {
    dbMock.select
      .mockReturnValueOnce(chain([{ totalPredictions: 10 }]))
      .mockReturnValueOnce(chain([{ totalFeedback: 5 }]))
      .mockReturnValueOnce(chain([{ avgRating: 4.2 }]))
      .mockReturnValueOnce(chain([{ accurateCount: 3 }]))
      .mockReturnValueOnce(chain([{ totalAccurateFeedback: 4 }]))
      .mockReturnValueOnce(chain([{ domain: "Finance", count: 5 }, { domain: "Health", count: 3 }]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]));

    const response = await GET();
    const body = await response.json();
    expect(body.predictionsByDomain).toHaveLength(2);
    expect(body.predictionsByDomain[0].domain).toBe("Finance");
  });

  it("returns recent predictions", async () => {
    dbMock.select
      .mockReturnValueOnce(chain([{ totalPredictions: 10 }]))
      .mockReturnValueOnce(chain([{ totalFeedback: 5 }]))
      .mockReturnValueOnce(chain([{ avgRating: 4.2 }]))
      .mockReturnValueOnce(chain([{ accurateCount: 3 }]))
      .mockReturnValueOnce(chain([{ totalAccurateFeedback: 4 }]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([{
        predictionId: "pred-1",
        rating: 5,
        wasAccurate: true,
        domain: "Career",
        predictionInput: "Will I get promoted?",
        predictionConfidence: 0.8,
        predictionCreatedAt: new Date(),
      }]));

    const response = await GET();
    const body = await response.json();
    expect(body.recentPredictions).toHaveLength(1);
    expect(body.recentPredictions[0].input).toBe("Will I get promoted?");
  });

  it("rejects unauthorized", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("handles no feedback gracefully", async () => {
    dbMock.select
      .mockReturnValueOnce(chain([{ totalPredictions: 0 }]))
      .mockReturnValueOnce(chain([{ totalFeedback: 0 }]))
      .mockReturnValueOnce(chain([{ avgRating: 0 }]))
      .mockReturnValueOnce(chain([{ accurateCount: 0 }]))
      .mockReturnValueOnce(chain([{ totalAccurateFeedback: 0 }]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]))
      .mockReturnValueOnce(chain([]));

    const response = await GET();
    const body = await response.json();
    expect(body.avgRating).toBe(0);
    expect(body.accuracyRate).toBe(0);
  });
});
