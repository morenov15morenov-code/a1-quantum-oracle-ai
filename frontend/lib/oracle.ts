import { AnalyticsEngine } from "./analytics-engine";
import { ForecastEngine } from "./forecast-engine";
import { ResponseGenerator } from "./response-generator";
import { validateGeneratedResponse } from "./protocol7";

export { type OracleContext } from "./analytics-engine";

export interface OracleInput {
  input: string;
  context?: string;
  domainCategory?: string;
  userId?: string;
}

const FALLBACK = {
  result: "The Oracle is silent on this matter.",
  confidence: 0,
  reasoning: "The prediction pipeline encountered an error.",
};

export async function queryOracle(oracleInput: OracleInput): Promise<{
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
  similarCasesUsed: number;
}> {
  let similarCasesUsed = 0;
  let analysis;
  try {
    analysis = await AnalyticsEngine.run(
      oracleInput.input,
      oracleInput.context,
      oracleInput.domainCategory,
      oracleInput.userId
    );
    similarCasesUsed = analysis.similarCasesUsed;
  } catch (e: any) {
    console.error("AnalyticsEngine failed:", e?.message || e);
    analysis = {
      input: oracleInput.input,
      userContext: "",
      domain: "General",
      systemPrompt: "",
      similarCasesUsed: 0,
    };
  }

  let forecast;
  try {
    forecast = await ForecastEngine.run(analysis);
  } catch (e: any) {
    console.error("ForecastEngine failed:", e?.message || e);
    return { result: `ForecastEngine ERROR: ${e?.message || String(e)}`, confidence: 0, reasoning: "forecast error", model: "error", similarCasesUsed };
  }

  let draft;
  try {
    draft = ResponseGenerator.run(forecast);
  } catch (e: any) {
    console.error("ResponseGenerator failed:", e?.message || e);
    return {
      result: forecast.result || FALLBACK.result,
      confidence: forecast.confidence ?? FALLBACK.confidence,
      reasoning: forecast.reasoning || FALLBACK.reasoning,
      tokensIn: forecast.tokensIn,
      tokensOut: forecast.tokensOut,
      model: forecast.model,
      similarCasesUsed,
    };
  }

  let finalResponse = draft;
  try {
    const guard = validateGeneratedResponse(draft);
    if (!guard.success) {
      finalResponse = ResponseGenerator.safeFallback(analysis.input, guard.reason ?? "Protocol 7 restriction");
    }
  } catch (e: any) {
    console.error("Protocol7 validation failed:", e?.message || e);
  }

  const result = finalResponse.result?.trim() || FALLBACK.result;
  const confidence = typeof finalResponse.confidence === "number" ? finalResponse.confidence : FALLBACK.confidence;
  const reasoning = finalResponse.reasoning?.trim() || FALLBACK.reasoning;

  return {
    result,
    confidence,
    reasoning,
    tokensIn: finalResponse.tokensIn,
    tokensOut: finalResponse.tokensOut,
    model: finalResponse.model,
    similarCasesUsed,
  };
}
