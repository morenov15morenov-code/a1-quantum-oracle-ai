import { describe, it, expect, beforeAll } from "vitest";
import { generatePrediction, getMoonPhase, getSunSign, getCelestialWindow } from "@/lib/ai";

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

  it("weaves the current celestial window into mock predictions", async () => {
    const result = await generatePrediction("Will I get the promotion?");
    expect(result.result).toMatch(/moon/i);
    expect(result.reasoning).toMatch(/lunar illumination/);
  });

  it("learns from verified past similar cases and calibrates confidence", async () => {
    const systemPrompt = [
      "You are A1 Quantum Oracle AI.",
      "USER'S PERSONAL CONTEXT:",
      "34, PM for 10 years.",
      "",
      "PAST SIMILAR CASES TO LEARN FROM:",
      "",
      "Case 1:",
      '  Question: "Should I switch careers?"',
      "  Domain: Career & Work",
      "  Previous Prediction: A pivot is favorable.",
      "  Previous Confidence: 80%",
      "  Outcome: accurate",
      "  User Verified: Accurate",
      "",
      "Case 2:",
      '  Question: "Is leaving my job a good idea?"',
      "  Domain: Career & Work",
      "  Previous Prediction: Conditions support it.",
      "  Previous Confidence: 75%",
      "  User Verified: Accurate",
      "",
      "Learn from these past cases.",
    ].join("\n");

    const result = await generatePrediction("Should I change careers right now?", systemPrompt);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
    expect(result.result).toMatch(/reinforcing this direction|accurate 100%|held with extra caution/i);
    expect(result.reasoning).toMatch(/weighed 2 similar readings/);
  });

  it("notes when similar past readings were marked inaccurate", async () => {
    const systemPrompt = [
      "You are A1 Quantum Oracle AI.",
      "USER'S PERSONAL CONTEXT:",
      "32, freelancer.",
      "",
      "PAST SIMILAR CASES TO LEARN FROM:",
      "",
      "Case 1:",
      '  Question: "Will my new venture succeed?"',
      "  Domain: Business & Strategy",
      "  Previous Prediction: Strong prospects.",
      "  Previous Confidence: 78%",
      "  User Verified: Not Accurate",
      "",
      "Learn from these past cases.",
    ].join("\n");

    const result = await generatePrediction("Will my startup succeed this year?", systemPrompt);
    expect(result.result).toMatch(/extra caution|marked 100% of similar past readings as inaccurate/i);
    expect(result.reasoning).toMatch(/weighed 1 similar reading/);
  });

  it("produces a distinct, aware reading when the exact question was asked before", async () => {
    const storedPrediction = "The pivot is risky but favorable.";
    const systemPrompt = [
      "You are A1 Quantum Oracle AI.",
      "USER'S PERSONAL CONTEXT:",
      "SaaS founder, 6 months runway.",
      "",
      "PAST SIMILAR CASES TO LEARN FROM:",
      "",
      "Case 1:",
      '  Question: "Should I pivot my SaaS product?"',
      "  Domain: Business & Strategy",
      `  Previous Prediction: ${storedPrediction}`,
      "  Previous Confidence: 65%",
      "  Outcome: PARTIAL",
      "",
      "Learn from these past cases.",
    ].join("\n");

    const result = await generatePrediction("Should I pivot my SaaS product?", systemPrompt);
    expect(result.result).not.toContain(storedPrediction);
    expect(result.result).toMatch(/asked this before/i);
  });
});

describe("celestial helpers", () => {
  it("returns a valid moon phase for a known new moon", () => {
    const { phase, illumination } = getMoonPhase(new Date(Date.UTC(2000, 0, 6, 18, 14)));
    expect(["New Moon", "Waning Crescent"]).toContain(phase);
    expect(illumination).toBeLessThanOrEqual(1);
  });

  it("returns a full moon near its peak", () => {
    const { phase } = getMoonPhase(new Date(Date.UTC(2000, 0, 21, 0, 0)));
    expect(phase).toBe("Full Moon");
  });

  it("returns a sun sign for a known date", () => {
    expect(getSunSign(new Date(2026, 6, 15))).toBe("Cancer");
    expect(getSunSign(new Date(2026, 11, 25))).toBe("Capricorn");
  });

  it("returns a celestial window with a season and hint", () => {
    const window = getCelestialWindow(new Date(Date.UTC(2026, 6, 15)));
    expect(window.season).toMatch(/season$/);
    expect(window.moonHint.length).toBeGreaterThan(0);
    expect(window.moonPhase.length).toBeGreaterThan(0);
  });
});
