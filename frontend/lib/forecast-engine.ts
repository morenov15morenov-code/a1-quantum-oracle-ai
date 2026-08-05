import { generatePrediction, type PredictionResult } from "./ai";
import type { AnalyticsResult } from "./analytics-engine";

export type ForecastResult = PredictionResult;

export const ForecastEngine = {
  async run(analysis: AnalyticsResult): Promise<ForecastResult> {
    return generatePrediction(analysis.input, analysis.systemPrompt);
  },
};
