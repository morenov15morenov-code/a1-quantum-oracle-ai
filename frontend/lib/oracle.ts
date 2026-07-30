import { generatePrediction, type PredictionResult } from "./ai";
import { findSimilarPredictions } from "./similarity";
import { db } from "./db";
import { predictions, predictionFeedbacks } from "./schema";
import { eq, sql } from "drizzle-orm";

export interface OracleInput {
  input: string;
  context?: string;
  domainCategory?: string;
}

export interface OracleContext {
  similarPastCases: Array<{
    input: string;
    result: string;
    confidence: number | null;
    outcomeStatus: string | null;
    wasAccurate: boolean | null;
    domainCategory: string | null;
  }>;
  userContext: string;
  domain: string;
}

function buildSystemPrompt(oracleContext: OracleContext): string {
  let prompt = `You are Atlas Oracle — a universal foresight engine that provides unique, personalized predictions for every user.

CRITICAL RULES:
- Never give the same answer twice. Each response must be unique to the person asking.
- Use the user's specific context and background to personalize the prediction.
- If there are past similar cases with outcomes, learn from them and incorporate those lessons.

`;

  if (oracleContext.domain) {
    prompt += `PRIMARY DOMAIN: ${oracleContext.domain}\n\n`;
  }

  if (oracleContext.userContext) {
    prompt += `USER'S PERSONAL CONTEXT:\n${oracleContext.userContext}\n\n`;
  }

  if (oracleContext.similarPastCases.length > 0) {
    prompt += `PAST SIMILAR CASES TO LEARN FROM:\n`;
    oracleContext.similarPastCases.forEach((c, i) => {
      prompt += `\nCase ${i + 1}:\n`;
      prompt += `  Question: "${c.input}"\n`;
      prompt += `  Domain: ${c.domainCategory || "General"}\n`;
      prompt += `  Previous Prediction: ${c.result}\n`;
      prompt += `  Previous Confidence: ${c.confidence !== null ? Math.round(c.confidence * 100) + "%" : "N/A"}\n`;
      if (c.outcomeStatus) {
        prompt += `  Outcome: ${c.outcomeStatus}\n`;
      }
      if (c.wasAccurate !== null) {
        prompt += `  User Verified: ${c.wasAccurate ? "Accurate" : "Not Accurate"}\n`;
      }
    });
    prompt += `\nLearn from these past cases. If the current question is similar but the person has different context, adjust accordingly. Do NOT copy previous answers.\n\n`;
  }

  prompt += `Respond in JSON format: { "result": "...", "confidence": 0.XX, "reasoning": "..." }

The "result" must be a personalized prediction that directly addresses THIS person's specific situation. Include why this answer is tailored to them given their context.

The "reasoning" should reference any relevant past cases and explain how the user's unique context influenced the prediction.`;

  return prompt;
}

export async function queryOracle(oracleInput: OracleInput): Promise<{
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
  similarCasesUsed: number;
}> {
  const domain = oracleInput.domainCategory || "General";
  const userContext = oracleInput.context || "";
  const userInput = oracleInput.input;

  const pastPredictions = await db
    .select({
      id: predictions.id,
      input: predictions.input,
      result: predictions.result,
      confidence: predictions.confidence,
      reasoning: predictions.reasoning,
      context: predictions.context,
      domainCategory: predictions.domainCategory,
      outcomeStatus: predictions.outcomeStatus,
      createdAt: predictions.createdAt,
      feedbackWasAccurate: predictionFeedbacks.wasAccurate,
      feedbackRating: predictionFeedbacks.rating,
    })
    .from(predictions)
    .leftJoin(predictionFeedbacks, eq(predictions.id, predictionFeedbacks.predictionId))
    .orderBy(sql`${predictions.createdAt} DESC`)
    .limit(100)
    .all();

  const typedPast = pastPredictions.map((p) => ({
    id: p.id,
    input: p.input,
    result: p.result,
    confidence: p.confidence,
    reasoning: p.reasoning,
    context: p.context,
    domainCategory: p.domainCategory,
    outcomeStatus: p.outcomeStatus,
    feedbackWasAccurate: p.feedbackWasAccurate,
    feedbackRating: p.feedbackRating,
    createdAt: p.createdAt,
  }));

  const similar = findSimilarPredictions(userInput, domain, typedPast, 5);

  const oracleContext: OracleContext = {
    similarPastCases: similar.map((s) => ({
      input: s.prediction.input,
      result: s.prediction.result,
      confidence: s.prediction.confidence,
      outcomeStatus: s.prediction.outcomeStatus,
      wasAccurate: s.prediction.feedbackWasAccurate,
      domainCategory: s.prediction.domainCategory,
    })),
    userContext,
    domain,
  };

  const systemPrompt = buildSystemPrompt(oracleContext);

  const aiResult: PredictionResult = await generatePrediction(userInput, systemPrompt);

  return {
    result: aiResult.result,
    confidence: aiResult.confidence,
    reasoning: aiResult.reasoning,
    tokensIn: aiResult.tokensIn,
    tokensOut: aiResult.tokensOut,
    similarCasesUsed: similar.length,
  };
}
