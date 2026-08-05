import { describe, it, expect } from "vitest";
import { ResponseGenerator } from "@/lib/response-generator";

describe("ResponseGenerator", () => {
  it("composes the final response from a forecast", () => {
    const draft = ResponseGenerator.run({
      result: "  A bright future awaits.  ",
      confidence: 0.82,
      reasoning: "  Based on historical cycles.  ",
      tokensIn: 10,
      tokensOut: 20,
    });

    expect(draft).toEqual({
      result: "A bright future awaits.",
      confidence: 0.82,
      reasoning: "Based on historical cycles.",
      tokensIn: 10,
      tokensOut: 20,
    });
  });

  it("applies safe defaults when forecast fields are missing", () => {
    const draft = ResponseGenerator.run({
      result: "",
      confidence: undefined,
      reasoning: "",
    });

    expect(draft.result).toBe("No prediction generated.");
    expect(draft.confidence).toBe(0.5);
    expect(draft.reasoning).toBe("No reasoning provided.");
  });

  it("clamps confidence into the 0-1 range", () => {
    expect(ResponseGenerator.run({ result: "r", confidence: 1.5, reasoning: "x" }).confidence).toBe(1);
    expect(ResponseGenerator.run({ result: "r", confidence: -0.2, reasoning: "x" }).confidence).toBe(0);
  });

  it("builds a safe fallback when a response is blocked", () => {
    const fallback = ResponseGenerator.safeFallback("Should I hack? ", "Protocol 7 restriction");
    expect(fallback.result).toContain("declined");
    expect(fallback.result).toContain("Protocol 7 restriction");
    expect(fallback.confidence).toBe(0);
    expect(fallback.reasoning).toContain("Protocol 7");
  });
});
