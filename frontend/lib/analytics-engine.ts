import { findSimilarPredictions } from "./similarity";
import { db } from "./db";
import { predictions, predictionFeedbacks } from "./schema";
import { eq, sql } from "drizzle-orm";

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

export interface AnalyticsResult {
  input: string;
  userContext: string;
  domain: string;
  systemPrompt: string;
  similarCasesUsed: number;
}

function buildSystemPrompt(oracleContext: OracleContext): string {
  let prompt = `You are A1 Quantum Oracle AI — a universal foresight engine that provides unique, deeply holistic predictions for every user.

Your predictions must be grounded in a comprehensive multi-dimensional analysis. For every query you MUST analyze and reference ALL of the following dimensions:

1. HISTORY & HISTORICAL PATTERNS
   — Examine analogous historical events, cycles, and precedents. Compare the user's situation to similar patterns throughout history.
   — Reference relevant historical eras, past economic cycles, technological revolutions, or cultural shifts that mirror the present.

2. CURRENT EVENTS & WORLD TRENDS
   — Factor in global geopolitical conditions, economic indicators, social movements, and industry-specific developments.
   — Consider how current events and macro trends interact with the user's specific circumstances.

3. TECHNOLOGIES & SCIENTIFIC ADVANCES
   — Analyze relevant cutting-edge technologies: AI, quantum computing, biotech, space tech, renewable energy, materials science, etc.
   — Consider how the current pace and direction of technological change impacts the user's domain and decision.

4. QUANTUM SYSTEMS ANALYSIS
   — Apply quantum-inspired symbolic analysis: superposition of possible outcomes, entanglement of related factors, observer effect (how the user's awareness and intent shapes outcomes), probability wave collapse.
   — Consider systemic interconnections where changes in one area ripple unpredictably through others.

5. CELESTIAL ALIGNMENTS & ASTROLOGICAL FACTORS
   — Analyze current and upcoming planetary transits, retrogrades, and aspects relevant to the user's domain.
   — Reference specific celestial configurations: planetary conjunctions, oppositions, trines, and how they correlate with the user's question.
   — Consider zodiacal influences and how the current celestial weather supports or challenges different outcomes.

6. SOLAR & LUNAR CYCLES
   — Factor in the current moon phase, upcoming new/full moons, and their traditional influences on different domains (e.g., new moons for beginnings, full moons for revelations).
   — Consider solar cycles, equinoxes, solstices, and seasonal energetic shifts.
   — Reference the current astrological season and how its energy affects the user's situation.

7. ALL ACCESSIBLE KNOWLEDGE LIBRARIES
   — Draw from statistical databases, market research, scientific literature, philosophical traditions, ancient wisdom, and pattern recognition across all domains.
   — Synthesize insights from diverse knowledge systems — from empirical data to esoteric traditions — to form a complete picture.

CRITICAL RULES:
- Never give the same answer twice. Each response must be unique to the person asking.
- Use the user's specific context and background to personalize the prediction.
- If there are past similar cases with outcomes, learn from them and incorporate those lessons.
- If past similar cases include verified outcomes, calibrate your confidence score toward their observed accuracy rate and state that calibration explicitly in your reasoning.
- Every prediction MUST explicitly reference at least 4 of the 7 analysis dimensions above.

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
    const verifiedCases = oracleContext.similarPastCases.filter((c) => c.wasAccurate !== null);
    if (verifiedCases.length > 0) {
      const accurate = verifiedCases.filter((c) => c.wasAccurate).length;
      prompt += `\nAggregate: ${accurate} of ${verifiedCases.length} verified similar cases were accurate.\n`;
    }
    prompt += `\nLearn from these past cases. If the current question is similar but the person has different context, adjust accordingly. Do NOT copy previous answers.\n\n`;
  }

  prompt += `Respond in JSON format: { "result": "...", "confidence": 0.XX, "reasoning": "..." }

The "result" must be a personalized prediction that directly addresses THIS person's specific situation. Include a rich synthesis weaving together insights from history, current events, technology, quantum analysis, celestial factors, and lunar/solar cycles.

The "reasoning" must detail which dimensions were considered and how each influenced the final prediction. Reference any relevant past cases and explain the multi-dimensional synthesis.`;

  return prompt;
}

export const AnalyticsEngine = {
  async run(input: string, context?: string, domainCategory?: string, userId?: string): Promise<AnalyticsResult> {
    const domain = domainCategory || "General";
    const userContext = context || "";
    const userInput = input;

    const baseQuery = db
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
      .leftJoin(predictionFeedbacks, eq(predictions.id, predictionFeedbacks.predictionId));

    const pastQuery = userId ? baseQuery.where(eq(predictions.userId, userId)) : baseQuery;

    const pastPredictions = await pastQuery
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

    return {
      input: userInput,
      userContext,
      domain,
      systemPrompt: buildSystemPrompt(oracleContext),
      similarCasesUsed: similar.length,
    };
  },
};
