import { describe, it, expect, beforeAll } from "vitest";
import { predictionSchema } from "@/lib/validations";
import { generatePrediction } from "@/lib/ai";

describe("Predictions API logic", () => {
  describe("prediction schema validation", () => {
    it("validates correct input", () => {
      const result = predictionSchema.safeParse({
        input: "Will the market go up next month?",
      });
      expect(result.success).toBe(true);
    });

    it("rejects too-short input", () => {
      const result = predictionSchema.safeParse({ input: "No" });
      expect(result.success).toBe(false);
    });
  });

  describe("AI generation", () => {
    beforeAll(() => {
      process.env.OPENAI_API_KEY = "sk-your-openai-api-key";
    });

    it("generates prediction in mock mode", async () => {
      const result = await generatePrediction("Test question for prediction?");
      expect(result).toHaveProperty("result");
      expect(result).toHaveProperty("confidence");
      expect(result).toHaveProperty("reasoning");
      expect(typeof result.result).toBe("string");
      expect(typeof result.confidence).toBe("number");
      expect(typeof result.reasoning).toBe("string");
    });

    it("generates confidence within valid range", async () => {
      const predictions = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          generatePrediction(`Test query ${i + 1}`)
        )
      );
      predictions.forEach((p) => {
        expect(p.confidence).toBeGreaterThanOrEqual(0);
        expect(p.confidence).toBeLessThanOrEqual(1);
      });
    });
  });
});
