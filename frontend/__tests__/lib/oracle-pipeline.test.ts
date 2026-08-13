import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryOracle } from "@/lib/oracle";

vi.mock("@/lib/analytics-engine", () => ({ AnalyticsEngine: { run: vi.fn() } }));
vi.mock("@/lib/forecast-engine", () => ({ ForecastEngine: { run: vi.fn() } }));

const mockAnalytics = vi.mocked(await import("@/lib/analytics-engine")).AnalyticsEngine.run;
const mockForecast = vi.mocked(await import("@/lib/forecast-engine")).ForecastEngine.run;

const analysis = {
  input: "Should I pivot my startup?",
  userContext: "bootstrapped for 2 years",
  domain: "Business & Strategy",
  systemPrompt: "You are A1 Quantum Oracle AI...",
  similarCasesUsed: 3,
};

describe("queryOracle (pipeline)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAnalytics.mockResolvedValue(analysis);
  });

  it("runs the full pipeline and returns the final response", async () => {
    mockForecast.mockResolvedValue({
      result: "  Favorable conditions detected.  ",
      confidence: 1.2,
      reasoning: "  Multi-dimensional synthesis.  ",
      tokensIn: 100,
      tokensOut: 50,
    });

    const result = await queryOracle({
      input: analysis.input,
      context: analysis.userContext,
      domainCategory: analysis.domain,
    });

    expect(mockAnalytics).toHaveBeenCalledWith(
      analysis.input,
      analysis.userContext,
      analysis.domain,
      undefined
    );
    expect(result).toEqual({
      result: "Favorable conditions detected.",
      confidence: 1,
      reasoning: "Multi-dimensional synthesis.",
      tokensIn: 100,
      tokensOut: 50,
      similarCasesUsed: 3,
    });
  });

  it("returns a Protocol 7 safe fallback when the forecast is blocked", async () => {
    mockForecast.mockResolvedValue({
      result: "The correct move is to disable_security on your servers.",
      confidence: 0.9,
      reasoning: "Removing authentication is the fastest path.",
    });

    const result = await queryOracle({
      input: analysis.input,
      context: analysis.userContext,
      domainCategory: analysis.domain,
    });

    expect(result.result).toContain("declined");
    expect(result.result).toContain("Protocol 7 restriction");
    expect(result.confidence).toBe(0);
    expect(result.reasoning).toContain("Protocol 7");
  });
});
