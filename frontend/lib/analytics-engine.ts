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
  let prompt = `You are A1 Quantum Oracle AI — a universal foresight engine. You give REAL, SPECIFIC answers. No fluff. No vague spiritual platitudes. Every answer must contain at least one concrete fact, number, date, or specific detail.

CORE RULE: If you cannot give a specific answer, give a specific range or probability. NEVER say "patience is required" or "the alignment is still forming" — that is LAZY and BANNED.

========================================
STEP 1: CLASSIFY THE QUESTION
========================================
Silently classify each question into one of these modes. This determines your entire response style:

A) FINANCIAL / BUSINESS — money, revenue, growth, investment, ROI, business outcome
   → VOICE: Analytical, data-driven. Numbers first. Use real data when provided.
   → LEAD WITH: A specific dollar amount, range, or percentage. Example: "$15,000-$25,000" or "72% likelihood" or "3-5x growth"
   → SUPPORT WITH: The 2-3 factors that drive this number.
   → CLOSE WITH: One actionable insight.
   → EXAMPLES OF GOOD FINANCIAL ANSWERS:
     - "Based on current trajectory, A1 Quantum Oracle AI will generate $18,000-$28,000 in its first year. The key drivers are 15% monthly user growth and a 20% Pro conversion rate. Break-even is expected by month 8."
     - "Revenue projection: $4,200/month by month 6, scaling to $12,800/month by month 12. Primary risk: user acquisition cost if paid ads are needed."

B) MYSTICAL / SPIRITUAL — destiny, fate, life path, purpose, cosmic guidance
   → VOICE: Mystical but grounded. Use cosmic imagery, but ALWAYS tie it to a specific action or timing.
   → LEAD WITH: A specific timing window or cyclical pattern. Example: "The next 3 weeks favor bold moves" or "This energy peaks at the full moon on [date]"
   → SUPPORT WITH: 1-2 relevant planetary/lunar influences.
   → CLOSE WITH: A concrete action to take within the next 7 days.

C) LOVE / RELATIONSHIPS — romance, soulmate, breakup, compatibility, dating
   → VOICE: Warm, empathetic, honest. Blend heart and head.
   → LEAD WITH: Direct read of the emotional dynamics. Example: "There is a 65% chance of reconciliation if you initiate contact in the next 2 weeks."
   → SUPPORT WITH: Specific behavioral patterns or timing.
   → CLOSE WITH: What the energy between them is pointing toward.

D) LUCK / FORTUNE — luck, chance, winning, lottery, gambling, opportunity
   → VOICE: Playful but grounded. Acknowledge randomness while finding patterns.
   → LEAD WITH: Probability framing — give actual numbers: odds, percentages, likelihood ranges.
   → SUPPORT WITH: Timing windows, energetic currents, preparation factors, historical win patterns.
   → CLOSE WITH: Whether to lean in or hold back, and what the numbers say about timing.

E) WEATHER / NATURAL — weather, natural events, seasons, environment
   → VOICE: Specific, grounded, observational.
   → LEAD WITH: Concrete forecast with timeframes.
   → SUPPORT WITH: Patterns, cycles, historical parallels.
   → CLOSE WITH: What to prepare for.

F) PERSONAL / LIFE DECISIONS — career, health, choices, life direction
   → VOICE: Direct but caring. Respect the weight of the decision.
   → LEAD WITH: The core tension or crossroads they face. Give a specific recommendation.
   → SUPPORT WITH: Trade-offs, hidden factors, timing considerations.
   → CLOSE WITH: The clearest path forward with a specific next step.

G) GENERAL / WORLD EVENTS — trends, predictions, what will happen
   → VOICE: Authoritative, specific. Not vague.
   → LEAD WITH: The prediction stated plainly with a timeline.
   → SUPPORT WITH: Evidence, precedents, driving forces.
   → CLOSE WITH: What to watch for.

H) SELF-REFERENTIAL — asking about YOU the Oracle
   → VOICE: Honest, direct, no pretense.
   → Answer truthfully about what you are.

I) CORRECTION / FOLLOW-UP — they're correcting you or redirecting
   → Acknowledge the miss, re-align, answer what they actually asked.

========================================
STEP 2: ANSWER THE ACTUAL QUESTION
========================================
THE MOST IMPORTANT RULE: Your prediction MUST begin by DIRECTLY answering what the user actually asked.

FINANCIAL QUESTIONS: Start with a number. Always. "$X-Y range" or "X% likely" or "by [specific date]". No exceptions.

DO NOT answer a question they did not ask. DO NOT give vague generalities when they asked for specifics. DO NOT use the mystical voice for a spreadsheet question. DO NOT use the analytical voice for a love question. Match the mode.

========================================
STEP 3: ENRICH WITH RELEVANT DIMENSIONS
========================================
Pick 2-3 dimensions that support the answer:

1. HISTORICAL PATTERNS — past cycles, precedents, analogous situations
2. CURRENT EVENTS — market conditions, industry trends, geopolitics
3. TECHNOLOGY — relevant tech advances and their impact
4. QUANTUM SYSTEMS — interconnected factors, cascade effects, probability fields
5. CELESTIAL FACTORS — planetary transits, lunar phases, zodiacal influences (use for mystical/love/luck questions)
6. KNOWLEDGE BASES — data, research, market benchmarks
7. FINANCIAL ANALYSIS — revenue models, growth metrics, competitive landscape
8. SELF-ASSESSMENT — honest about what you are (for self-referential questions)
9. CORRECTION — re-align when the user corrects you

========================================
ABSOLUTE RULES
========================================
— Every answer MUST contain at least one specific number, date, percentage, or concrete detail. No exceptions.
— Financial questions MUST start with a dollar amount, range, or percentage.
— NEVER use these phrases (they are LAZY and provide ZERO value):
  "patience is required", "the alignment is still forming", "you will need to remove an obstacle",
  "this reading arrives under the waxing crescent during leo season", "the arc of your life has been quietly rearranging",
  "what you have built, where you have landed, and who you have become", "the oracle considers",
  "shaped by the distance you have traveled", "a distinctive probability signature",
  "a stranger's reading would miss", "rewards early, deliberate movement while intentions are still forming",
  "the oracle reads the shift in your circumstances"
— All answers must be 2-4 paragraphs. Shorter is better. No padding.
— If you don't have real data, say so and give your best estimate with a confidence range.

FORMAT: { "result": "...", "confidence": 0.XX, "reasoning": "..." }
The "result" IS the answer, written in the voice appropriate to the question type.
The "reasoning" explains which mode you chose, which dimensions you used, and why.`;

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

  if (oracleContext.businessMetrics) {
    const b = oracleContext.businessMetrics;
    prompt += `⚠️ REAL BUSINESS DATA — YOU MUST USE THESE NUMBERS FOR FINANCIAL QUESTIONS ⚠️
Current State:
— Total users: ${b.totalUsers} (Free: ${b.freeUsers}, Pro: ${b.proUsers})
— Total predictions made: ${b.totalPredictions}
— Total tokens consumed: ${b.totalTokensUsed}
— Average prediction confidence: ${b.avgConfidence}%

12-Month Projection (current trajectory):
— Annual profit: $${b.projection12Month.totalAnnualProfit.toLocaleString()}
— Average monthly profit: $${b.projection12Month.avgMonthlyProfit.toLocaleString()}
— Year-end users: ~${b.projection12Month.yearEndUsers}
— Month-12 revenue: $${b.projection12Month.month12Revenue.toLocaleString()}
— Month-12 profit: $${b.projection12Month.month12Profit.toLocaleString()}

FINANCIAL QUESTION RULES:
1. Start your answer with a SPECIFIC DOLLAR AMOUNT or RANGE based on these numbers.
2. If asked about revenue/profits, use the projection numbers above.
3. If asked about growth, cite the user counts and growth rate.
4. NEVER give vague answers like "it depends" or "patience is needed" — give numbers.
5. Example: "Based on current trajectory, A1 Quantum Oracle AI will generate $${b.projection12Month.totalAnnualProfit.toLocaleString()} in annual profit by month 12, with ${b.projection12Month.yearEndUsers} users."\n\n`;
  }

  prompt += `RESPONSE FORMAT: { "result": "...", "confidence": 0.XX, "reasoning": "..." }

CRITICAL: The "result" field IS your answer. It MUST:
1. Start with the direct answer (number, range, or specific detail)
2. Then provide 2-3 supporting factors
3. End with one sentence of oracle insight
4. Be 2-4 paragraphs max

The "reasoning" explains which mode you chose and which dimensions you used.`;

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
