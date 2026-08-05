import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsEngine } from "@/lib/analytics-engine";

const { dbMock } = vi.hoisted(() => ({ dbMock: { select: vi.fn() } }));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("@/lib/similarity", () => ({ findSimilarPredictions: vi.fn() }));

const mockSimilarity = vi.mocked(await import("@/lib/similarity")).findSimilarPredictions;

function mockPastChain(rows: unknown[]) {
  const terminal = { all: vi.fn().mockResolvedValue(rows) };
  return {
    from: vi.fn().mockReturnValue({
      leftJoin: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue(terminal),
        }),
      }),
    }),
  };
}

describe("AnalyticsEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSimilarity.mockReturnValue([]);
  });

  it("builds an analysis with domain and user context", async () => {
    dbMock.select.mockReturnValueOnce(mockPastChain([]));
    const result = await AnalyticsEngine.run("Should I switch careers?", "5 years as an engineer", "Career & Work");

    expect(result.domain).toBe("Career & Work");
    expect(result.userContext).toBe("5 years as an engineer");
    expect(result.similarCasesUsed).toBe(0);
    expect(result.input).toBe("Should I switch careers?");
    expect(result.systemPrompt).toContain("PRIMARY DOMAIN: Career & Work");
    expect(result.systemPrompt).toContain("USER'S PERSONAL CONTEXT:");
  });

  it("defaults the domain to General when none provided", async () => {
    dbMock.select.mockReturnValueOnce(mockPastChain([]));
    const result = await AnalyticsEngine.run("What does the future hold?", "", undefined);
    expect(result.domain).toBe("General");
  });

  it("includes past similar cases in the analysis", async () => {
    dbMock.select.mockReturnValueOnce(mockPastChain([]));
    mockSimilarity.mockReturnValue([
      {
        score: 0.6,
        prediction: {
          id: "1",
          input: "Should I leave my job?",
          result: "A pivot is favorable.",
          confidence: 0.8,
          reasoning: "cycle analysis",
          context: null,
          domainCategory: "Career & Work",
          outcomeStatus: "accurate",
          feedbackWasAccurate: true,
          feedbackRating: 4,
          createdAt: new Date(),
        },
      },
    ]);

    const result = await AnalyticsEngine.run("Should I change jobs?", "laid off", "Career & Work");

    expect(result.similarCasesUsed).toBe(1);
    expect(result.systemPrompt).toContain("PAST SIMILAR CASES TO LEARN FROM:");
    expect(result.systemPrompt).toContain("A pivot is favorable.");
    expect(result.systemPrompt).toContain("Previous Confidence: 80%");
  });
});
