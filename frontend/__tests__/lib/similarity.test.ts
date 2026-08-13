import { describe, it, expect } from "vitest";
import { findSimilarPredictions } from "@/lib/similarity";

interface CaseShape {
  id: string;
  input: string;
  result: string;
  confidence: number | null;
  reasoning: string | null;
  context: string | null;
  domainCategory: string | null;
  outcomeStatus: string | null;
  feedbackWasAccurate: boolean | null;
  feedbackRating: number | null;
  createdAt: Date;
}

function makeCase(overrides: Partial<CaseShape> & { input: string }): CaseShape {
  return {
    id: overrides.input,
    result: "A forecast.",
    confidence: 0.7,
    reasoning: "analysis",
    context: null,
    domainCategory: null,
    outcomeStatus: null,
    feedbackWasAccurate: null,
    feedbackRating: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("findSimilarPredictions", () => {
  it("returns an empty list when nothing is similar", () => {
    const result = findSimilarPredictions(
      "will the stock market rally next quarter",
      "Finance",
      [makeCase({ input: "should I buy a new bicycle helmet" })],
      5
    );
    expect(result).toEqual([]);
  });

  it("ranks phrase-level matches above loose word overlap", () => {
    const cases = [
      makeCase({ input: "should I switch careers", domainCategory: "Career & Work" }),
      makeCase({ input: "should I leave my job and start a new career path", domainCategory: "Career & Work" }),
    ];
    const result = findSimilarPredictions("should I switch careers now", "Career & Work", cases, 5);
    expect(result.length).toBe(2);
    expect(result[0].prediction.input).toBe("should I switch careers");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("boosts cases the user verified as accurate and penalizes inaccurate ones", () => {
    const accurate = makeCase({
      input: "will my startup succeed",
      domainCategory: "Business & Strategy",
      feedbackWasAccurate: true,
    });
    const inaccurate = makeCase({
      input: "will my startup succeed",
      domainCategory: "Business & Strategy",
      feedbackWasAccurate: false,
    });
    const result = findSimilarPredictions("will my startup succeed this year", "Business & Strategy", [inaccurate, accurate], 5);
    expect(result[0].prediction.id).toBe(accurate.input);
  });

  it("respects the maxResults cap", () => {
    const cases = [
      makeCase({ input: "will it rain tomorrow", domainCategory: "Weather" }),
      makeCase({ input: "will it snow tomorrow", domainCategory: "Weather" }),
      makeCase({ input: "will it storm tomorrow", domainCategory: "Weather" }),
      makeCase({ input: "will it be sunny tomorrow", domainCategory: "Weather" }),
      makeCase({ input: "will it be windy tomorrow", domainCategory: "Weather" }),
      makeCase({ input: "will it be cloudy tomorrow", domainCategory: "Weather" }),
    ];
    const result = findSimilarPredictions("will it rain tomorrow morning", "Weather", cases, 3);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});
