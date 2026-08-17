import { findSimilarPredictions } from "./similarity";
import { db } from "./db";
import { predictions, predictionFeedbacks, subscriptions, users } from "./schema";
import { eq, sql } from "drizzle-orm";
import { calculateProjection } from "./projection";

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
  businessMetrics?: {
    totalUsers: number;
    freeUsers: number;
    proUsers: number;
    totalPredictions: number;
    totalTokensUsed: number;
    avgConfidence: number;
    projection12Month: {
      totalAnnualProfit: number;
      avgMonthlyProfit: number;
      yearEndUsers: number;
      month12Revenue: number;
      month12Profit: number;
    };
  };
}

export interface AnalyticsResult {
  input: string;
  userContext: string;
  domain: string;
  systemPrompt: string;
  similarCasesUsed: number;
}

function buildSystemPrompt(oracleContext: OracleContext): string {
  let prompt = `You are A1 Quantum Oracle AI — a prediction engine that answers questions directly with numbers, dates, and specific details. You are NOT a fortune teller. You are a data-driven advisor.

RULE: Look at the question. Answer THAT question. If they ask about money, give dollar amounts. If they ask about a date, give a date. If they ask about a person, talk about that person. Never pivot to something else.

ANSWER STRUCTURE:
1. FIRST LINE: The direct answer. A number, a range, a percentage, a date. Start with it.
2. BODY: 2-3 sentences on the key factors behind that number.
3. LAST LINE: One sharp takeaway.

That's it. Be concise. Be specific. No padding.

STYLE:
— Speak like a sharp, honest advisor. Direct. Respectful of people's time.
— Match the question's energy: financial = analytical with numbers, romantic = warm but real, mystical = grounded with timing, etc.
— NEVER open with "The oracle considers..." or any third-person self-reference. Just answer.
— NEVER use these dead phrases — they add zero value:
  "patience is required", "the alignment is still forming", "the arc of your life",
  "quietly rearranging", "what you have built where you have landed",
  "rewards early deliberate movement", "the oracle reads the shift",
  "this reading arrives under", "a distinctive probability signature",
  "shaped by the distance you have traveled", "a stranger's reading would miss",
  "you will need to remove an obstacle"
— NEVER mention moon phases, zodiac, or astrology unless specifically asked about it.`;

  if (oracleContext.domain) {
    prompt += `\n\nDOMAIN: ${oracleContext.domain}`;
  }

  if (oracleContext.userContext) {
    prompt += `\n\nUSER CONTEXT:\n${oracleContext.userContext}`;
  }

  if (oracleContext.similarPastCases.length > 0) {
    prompt += `\n\nPAST SIMILAR PREDICTIONS (reference, don't copy):`;
    oracleContext.similarPastCases.forEach((c, i) => {
      prompt += `\n\nCase ${i + 1}: "${c.input}"`;
      prompt += `\n  Previous answer: ${c.result}`;
      prompt += `\n  Confidence: ${c.confidence !== null ? Math.round(c.confidence * 100) + "%" : "N/A"}`;
      if (c.outcomeStatus) prompt += `\n  Outcome: ${c.outcomeStatus}`;
      if (c.wasAccurate !== null) prompt += `\n  Verified: ${c.wasAccurate ? "Accurate" : "Not accurate"}`;
    });
    prompt += `\n\nAdjust for the current question's context. Do NOT repeat past answers.`;
  }

  if (oracleContext.businessMetrics) {
    const b = oracleContext.businessMetrics;
    prompt += `\n\nREAL BUSINESS DATA (USE THIS FOR FINANCIAL/BUSINESS QUESTIONS):
Current state:
— Users: ${b.totalUsers} total (${b.freeUsers} free, ${b.proUsers} pro)
— Predictions made: ${b.totalPredictions}
— Tokens used: ${b.totalTokensUsed}
— Avg confidence: ${b.avgConfidence}%

12-month projection (current trajectory):
— Annual profit: $${b.projection12Month.totalAnnualProfit.toLocaleString()}
— Monthly profit: $${b.projection12Month.avgMonthlyProfit.toLocaleString()}
— Year-end users: ~${b.projection12Month.yearEndUsers}
— Month-12 revenue: $${b.projection12Month.month12Revenue.toLocaleString()}
— Month-12 profit: $${b.projection12Month.month12Profit.toLocaleString()}

RULE: Financial questions MUST start with a dollar amount or range from this data. Give your best estimate. Never say "it depends."`;
  }

  prompt += `\n\nThe "reasoning" field should explain: what type of question this was, which factors you used, and why those specific numbers. Keep it analytical and transparent.

FORMAT: { "result": "...", "confidence": 0.XX, "reasoning": "..." }`;

  return prompt;
}

async function gatherBusinessMetrics() {
  try {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users).get();
    const tierCounts = await db
      .select({ tier: subscriptions.tier, count: sql<number>`count(*)` })
      .from(subscriptions)
      .groupBy(subscriptions.tier)
      .all();
    const totalPreds = await db.select({ count: sql<number>`count(*)` }).from(predictions).get();
    const tokenStats = await db
      .select({
        totalTokensIn: sql<number>`coalesce(sum(${predictions.tokensIn}), 0)`,
        totalTokensOut: sql<number>`coalesce(sum(${predictions.tokensOut}), 0)`,
        avgConfidence: sql<number>`coalesce(avg(${predictions.confidence}), 0)`,
      })
      .from(predictions)
      .get();

    const freeUsers = tierCounts.find((t) => t.tier === "FREE")?.count ?? 0;
    const proUsers = tierCounts.find((t) => t.tier === "PRO")?.count ?? 0;

    const projection = calculateProjection({
      currentUsers: totalUsers?.count ?? 0,
      monthlyGrowthRate: 0.15,
      freeTierPercent: proUsers + freeUsers > 0 ? Math.round((freeUsers / (freeUsers + proUsers)) * 100) : 80,
      proSubscriptionPrice: 19.99,
      predictionPrice: 4.99,
      aiCostPerPrediction: 0.02,
      monthlyHosting: 200,
      freePredictionsPerMonth: 5,
      proPredictionsPerMonth: 100,
      churnRate: 0.05,
    });

    const month12 = projection.months[11];

    return {
      totalUsers: totalUsers?.count ?? 0,
      freeUsers,
      proUsers,
      totalPredictions: totalPreds?.count ?? 0,
      totalTokensUsed: (tokenStats?.totalTokensIn ?? 0) + (tokenStats?.totalTokensOut ?? 0),
      avgConfidence: Math.round((tokenStats?.avgConfidence ?? 0) * 100),
      projection12Month: {
        totalAnnualProfit: projection.totalAnnualProfit,
        avgMonthlyProfit: projection.avgMonthlyProfit,
        yearEndUsers: projection.yearEndUsers,
        month12Revenue: month12.subscriptionRevenue + month12.predictionRevenue,
        month12Profit: month12.grossProfit,
      },
    };
  } catch {
    return undefined;
  }
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

    const businessMetrics = await gatherBusinessMetrics();

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
      businessMetrics,
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
