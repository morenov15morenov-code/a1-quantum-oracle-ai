import { describe, it, expect, vi, beforeEach } from "vitest";
import { ForecastEngine } from "@/lib/forecast-engine";

vi.mock("@/lib/ai", () => ({ generatePrediction: vi.fn() }));

const mockGenerate = vi.mocked(await import("@/lib/ai")).generatePrediction;

const analysis = {
  input: "Should I pivot my startup?",
  userContext: "bootstrapped for 2 years",
  domain: "Business & Strategy",
  systemPrompt: "You are A1 Quantum Oracle AI...",
  similarCasesUsed: 2,
};

describe("ForecastEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to the prediction generator with the analysis prompt", async () => {
    mockGenerate.mockResolvedValue({
      result: "Favorable conditions detected.",
      confidence: 0.78,
      reasoning: "Multi-dimensional synthesis.",
      tokensIn: 100,
      tokensOut: 50,
    });

    const result = await ForecastEngine.run(analysis);

    expect(mockGenerate).toHaveBeenCalledWith(analysis.input, analysis.systemPrompt);
    expect(result).toEqual({
      result: "Favorable conditions detected.",
      confidence: 0.78,
      reasoning: "Multi-dimensional synthesis.",
      tokensIn: 100,
      tokensOut: 50,
    });
  });
});
