import { AnalyticsEngine } from "./analytics-engine";
import { ForecastEngine } from "./forecast-engine";
import { ResponseGenerator } from "./response-generator";
import { validateGeneratedResponse } from "./protocol7";

export { type OracleContext } from "./analytics-engine";

export interface OracleInput {
  input: string;
  context?: string;
  domainCategory?: string;
}

export async function queryOracle(oracleInput: OracleInput): Promise<{
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
  similarCasesUsed: number;
}> {
  const analysis = await AnalyticsEngine.run(
    oracleInput.input,
    oracleInput.context,
    oracleInput.domainCategory
  );

  const forecast = await ForecastEngine.run(analysis);

  const draft = ResponseGenerator.run(forecast);

  const guard = validateGeneratedResponse(draft);
  const finalResponse = guard.success
    ? draft
    : ResponseGenerator.safeFallback(analysis.input, guard.reason ?? "Protocol 7 restriction");

  return {
    result: finalResponse.result,
    confidence: finalResponse.confidence,
    reasoning: finalResponse.reasoning,
    tokensIn: finalResponse.tokensIn,
    tokensOut: finalResponse.tokensOut,
    similarCasesUsed: analysis.similarCasesUsed,
  };
}
