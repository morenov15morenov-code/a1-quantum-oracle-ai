import { describe, it, expect, beforeAll } from "vitest";
import { generatePrediction } from "@/lib/ai";

describe("generatePrediction (mock mode)", () => {
  beforeAll(() => {
    process.env.OPENAI_API_KEY = "sk-your-openai-api-key";
  });

  it("returns a prediction result", async () => {
    const result = await generatePrediction("What will the stock market do next quarter?");
    expect(result).toBeDefined();
    expect(typeof result.result).toBe("string");
    expect(result.result.length).toBeGreaterThan(0);
  });

  it("returns a confidence score between 0 and 1", async () => {
    const result = await generatePrediction("Will it rain tomorrow?");
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("returns reasoning text", async () => {
    const result = await generatePrediction("Test prediction question");
    expect(typeof result.reasoning).toBe("string");
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it("returns deterministic results for same input length", async () => {
    const input = "What will happen in the next quarter?";
    const result1 = await generatePrediction(input);
    const result2 = await generatePrediction(input);

    const resultsAreDeterministic = result1.result === result2.result ||
      result1.confidence === result2.confidence;
    expect(resultsAreDeterministic).toBe(true);
  });

  it("handles very short input", async () => {
    const result = await generatePrediction("A");
    expect(result).toBeDefined();
    expect(result.result.length).toBeGreaterThan(0);
  });
});
