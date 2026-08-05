import type { ForecastResult } from "./forecast-engine";

export interface ResponseDraft {
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
}

export const ResponseGenerator = {
  run(forecast: ForecastResult): ResponseDraft {
    const result = (forecast.result || "").trim() || "No prediction generated.";
    const confidence = Math.min(1, Math.max(0, forecast.confidence ?? 0.5));
    const reasoning = (forecast.reasoning || "").trim() || "No reasoning provided.";
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
