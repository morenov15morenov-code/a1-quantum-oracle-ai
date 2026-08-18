import type { ForecastResult } from "./forecast-engine";

export interface ResponseDraft {
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
}

const BANNED_RESPONSE_PHRASES = [
  "patience is required",
  "the alignment is still forming",
  "the oracle considers",
  "the oracle sees",
  "the oracle reads",
  "the arc of your life",
  "quietly rearranging",
  "what you have built, where you have landed",
  "rewards early, deliberate movement",
  "this reading arrives under",
  "a distinctive probability signature",
  "shaped by the distance you have traveled",
  "a stranger's reading would miss",
  "on the matter of",
  "the oracle needs a moment to recalibrate",
  "the favorable path opens",
  "gives .* a distinctive",
  "notice the people who appear",
  "intention",
];

export const ResponseGenerator = {
  run(forecast: ForecastResult): ResponseDraft {
    let result = (forecast.result || "").trim() || "No prediction generated.";
    const confidence = Math.min(1, Math.max(0, forecast.confidence ?? 0.5));
    let reasoning = (forecast.reasoning || "").trim() || "No reasoning provided.";

    const lower = result.toLowerCase();
    const hasBanned = BANNED_RESPONSE_PHRASES.some((p) => lower.includes(p));

    if (hasBanned) {
      let cleaned = result;
      BANNED_RESPONSE_PHRASES.forEach((phrase) => {
        const regex = new RegExp(phrase, "gi");
        cleaned = cleaned.replace(regex, "").replace(/\s{2,}/g, " ").trim();
      });
      cleaned = cleaned.replace(/\.\s*\./g, ".").replace(/^\.\s*/, "").trim();
      if (cleaned.length > 30) {
        result = cleaned;
      } else {
        result = "The oracle needs a moment to recalibrate. Please try rephrasing your question more specifically — include numbers, dates, or concrete details for a better prediction.";
        reasoning = "Response filtered: contained template phrases instead of a direct answer.";
      }
    }
      result = "The oracle needs a moment to recalibrate. Please try rephrasing your question more specifically — include numbers, dates, or concrete details for a better prediction.";
      reasoning = "Response filtered: contained template phrases instead of a direct answer.";
    }

    return {
      result,
      confidence,
      reasoning,
      tokensIn: forecast.tokensIn,
      tokensOut: forecast.tokensOut,
    };
  },

  safeFallback(input: string, reason: string): ResponseDraft {
    return {
      result: `The oracle declined to answer this question. ${reason}.`,
      confidence: 0,
      reasoning: "The generated response was blocked by Protocol 7 (System Stability Guard).",
    };
  },
};
