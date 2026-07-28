/**
 * Atlas Oracle — Universal Prediction & Profit Simulation
 *
 * Simulates the Oracle serving ALL types of users with ANY question:
 * career, relationships, health, education, finance, creative, travel,
 * personal goals, family, entrepreneurship, and more.
 *
 * Measures prediction confidence distribution, user satisfaction proxy,
 * and revenue model viability.
 *
 * Run: npx tsx scripts/simulate.ts
 */

// ── Types ───────────────────────────────────────────────────────────

interface UserPersona {
  name: string;
  type: string;
  icon: string;
  questions: string[];
  willingnessToPay: number; // max $ per prediction
}

interface Prediction {
  confidence: number;
  result: string;
  reasoning: string;
}

interface SimTrade {
  cycle: number;
  user: string;
  userType: string;
  question: string;
  confidence: number;
  result: string;
  reasoning: string;
  predicted: "YES" | "NO" | "NEUTRAL";
  actualOutcome: "HAPPENED" | "DIDNT_HAPPEN" | "PARTIAL" | "UNVERIFIABLE";
  wasCorrect: boolean | null;
  revenue: number;
  satisfaction: number; // 1-5
}

// ── Mock prediction engine ──────────────────────────────────────────

const mockPool: Prediction[] = [
  {
    confidence: 0.91,
    result: "Strong indicators point to a favorable outcome. All primary factors are aligned.",
    reasoning: "Analysis of 8 key variables shows consistent positive correlation with successful outcomes in comparable scenarios.",
  },
  {
    confidence: 0.73,
    result: "Moderately positive outlook. 73% probability of success within the expected timeframe.",
    reasoning: "Historical data shows similar conditions yield positive results in roughly 3 out of 4 cases. Minor risk factors present.",
  },
  {
    confidence: 0.62,
    result: "Mixed signals. Proceed with cautious optimism and have a contingency plan ready.",
    reasoning: "4 of 7 leading indicators are favorable, but 3 show ambiguity. The outcome depends heavily on execution.",
  },
  {
    confidence: 0.84,
    result: "High-confidence positive forecast. The probability of achieving the desired outcome is very strong.",
    reasoning: "Cross-referencing 15 data points from similar past scenarios shows 84% success rate. No major red flags detected.",
  },
  {
    confidence: 0.55,
    result: "Near coin-flip odds. The outcome is genuinely uncertain — external factors will be decisive.",
    reasoning: "Balanced risk-reward profile. The model detects no dominant pattern. Recommend gathering more information before committing.",
  },
  {
    confidence: 0.78,
    result: "Favorable conditions detected. Timing appears right for moving forward with this plan.",
    reasoning: "Market conditions, personal readiness indicators, and environmental factors all point toward a positive window of opportunity.",
  },
  {
    confidence: 0.47,
    result: "Below-average probability. Significant headwinds suggest reconsidering the approach or timeline.",
    reasoning: "3 of 6 risk factors are elevated. Historical analogues with similar profiles show only 47% success — slightly worse than chance.",
  },
  {
    confidence: 0.88,
    result: "Very strong positive signal. This is among the most favorable prediction profiles the model generates.",
    reasoning: "Exceptional alignment across all measured dimensions. Only 12% of similar queries produce this level of confidence.",
  },
  {
    confidence: 0.67,
    result: "Slightly above average. Conditions lean positive but aren't overwhelming. Steady progress expected.",
    reasoning: "The data suggests modest gains or incremental progress rather than a breakthrough. Patience will be rewarded.",
  },
  {
    confidence: 0.52,
    result: "Essentially neutral. The outcome could go either way depending on choices made in the next 30 days.",
    reasoning: "The model identifies this as a decision-dependent scenario. Two equally likely paths diverge from the current state.",
  },
];

function getPrediction(input: string): Prediction {
  const idx = Math.abs(hashCode(input)) % mockPool.length;
  return mockPool[idx];
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

// ── User personas ───────────────────────────────────────────────────

const personas: UserPersona[] = [
  {
    name: "Alex — Startup Founder",
    type: "Entrepreneur",
    icon: "🚀",
    willingnessToPay: 15,
    questions: [
      "Should I pivot my SaaS product before running out of runway?",
      "Is this the right time to raise a Series A round?",
      "Will hiring a CTO now accelerate or slow down our growth?",
      "Should I accept the acquisition offer from the bigger company?",
      "Is my co-founder the right long-term partner for this venture?",
    ],
  },
  {
    name: "Sarah — Career Changer",
    type: "Professional",
    icon: "💼",
    willingnessToPay: 10,
    questions: [
      "Should I leave my corporate job to pursue UX design full-time?",
      "Will getting a Google certification improve my job prospects?",
      "Is relocating to Austin worth it for the tech scene?",
      "Should I negotiate the salary offer or accept what's on the table?",
      "Will freelancing give me more stability than a 9-to-5 in 2 years?",
    ],
  },
  {
    name: "Maria — New Parent",
    type: "Family",
    icon: "👶",
    willingnessToPay: 8,
    questions: [
      "Is it safe to travel internationally with a 6-month-old baby?",
      "Should we switch from breastmilk to formula at this stage?",
      "Will our toddler adjust well to daycare starting next month?",
      "Is the pediatrician's advice about vaccines up to date?",
      "Should we move to a bigger apartment before the baby starts walking?",
    ],
  },
  {
    name: "James — Fitness Enthusiast",
    type: "Health",
    icon: "🏋️",
    willingnessToPay: 7,
    questions: [
      "Will training for a marathon damage my knees long-term?",
      "Is intermittent fasting safe while doing heavy strength training?",
      "Should I take creatine supplements given my current workout routine?",
      "Will going keto help me break through my weight loss plateau?",
      "Is this shoulder pain something serious or just overuse?",
    ],
  },
  {
    name: "Priya — Graduate Student",
    type: "Education",
    icon: "📚",
    willingnessToPay: 6,
    questions: [
      "Should I pursue a PhD or enter the industry after my master's?",
      "Will this research topic be relevant and publishable in 3 years?",
      "Is taking on $80k in student loans for this program worth it?",
      "Should I apply to 5 programs or focus on my top 3?",
      "Will AI tools make my computer science degree less valuable?",
    ],
  },
  {
    name: "David — Real Estate Investor",
    type: "Finance",
    icon: "🏠",
    willingnessToPay: 20,
    questions: [
      "Should I buy a rental property in this neighborhood right now?",
      "Will interest rates drop enough in 6 months to refinance profitably?",
      "Is investing in REITs better than physical property for passive income?",
      "Should I sell my rental before the market correction or hold?",
      "Will this city's population growth support property value increases?",
    ],
  },
  {
    name: "Lena — Aspiring Artist",
    type: "Creative",
    icon: "🎨",
    willingnessToPay: 5,
    questions: [
      "Should I pursue music full-time or keep my day job for now?",
      "Will releasing an album on Spotify generate meaningful income?",
      "Is entering this art competition worth the entry fee and effort?",
      "Should I move to Nashville or LA to advance my music career?",
      "Will learning production software help me create better music faster?",
    ],
  },
  {
    name: "Omar — Recent Divorcee",
    type: "Personal",
    icon: "💔",
    willingnessToPay: 8,
    questions: [
      "Is it too soon to start dating again after the separation?",
      "Should I fight for full custody or pursue a joint arrangement?",
      "Will moving to a new city help me rebuild my life fresh?",
      "Should I go back to therapy or try a different approach?",
      "Is it the right time to change careers after this major life transition?",
    ],
  },
  {
    name: "Chen — Tech Employee",
    type: "Career",
    icon: "💻",
    willingnessToPay: 12,
    questions: [
      "Should I join the Series B startup or stay at FAANG for another year?",
      "Will the layoff wave at my company reach my team?",
      "Is learning Rust worth the investment for my career trajectory?",
      "Should I relocate to the Bay Area or stay remote from Denver?",
      "Will my current stock options be worth more if I stay another 2 years?",
    ],
  },
  {
    name: "Fatima — Small Business Owner",
    type: "Business",
    icon: "🏪",
    willingnessToPay: 10,
    questions: [
      "Should I expand my bakery to a second location this year?",
      "Will switching to online-only sales increase my profit margins?",
      "Is hiring two new employees feasible given my current revenue?",
      "Should I take the SBA loan or bootstrap the expansion?",
      "Will the new food truck trend hurt or help my brick-and-mortar shop?",
    ],
  },
  {
    name: "Jake — High School Student",
    type: "Education",
    icon: "🎓",
    willingnessToPay: 3,
    questions: [
      "Should I apply to Ivy League schools or focus on state universities?",
      "Will studying abroad in Japan look good on college applications?",
      "Should I pick computer science or business as my college major?",
      "Will joining the debate team help me get into a good law school?",
      "Is it better to take AP classes or get a part-time job for experience?",
    ],
  },
  {
    name: "Rosa — Retiree",
    type: "Lifestyle",
    icon: "🌅",
    willingnessToPay: 5,
    questions: [
      "Should I move to Portugal or stay in the US for retirement?",
      "Will my savings last through a 30-year retirement comfortably?",
      "Is it safe to start a small garden business at my age?",
      "Should I downsize the house now or wait another 5 years?",
      "Will learning Spanish help me integrate better if I move abroad?",
    ],
  },
];

// ── Simulation engine ───────────────────────────────────────────────

const PRICE_PER_PREDICTION = 4.99;

function simulateOutcomes(confidence: number): { outcome: SimTrade["actualOutcome"]; correct: boolean | null } {
  const r = Math.random();
  const actualProb = confidence;

  if (r < 0.15) return { outcome: "UNVERIFIABLE", correct: null }; // 15% can't be verified

  if (r < 0.15 + actualProb * 0.85) {
    return { outcome: "HAPPENED", correct: true };
  }
  if (r < 0.15 + actualProb * 0.85 + (1 - actualProb) * 0.6) {
    return { outcome: "DIDNT_HAPPEN", correct: false };
  }
  return { outcome: "PARTIAL", correct: null }; // partial = partly correct
}

function simulateSatisfaction(confidence: number, wasCorrect: boolean | null): number {
  if (wasCorrect === null) return 3 + Math.random() * 2; // unverifiable: 3-5
  if (wasCorrect) return 4 + Math.random(); // correct: 4-5
  return 2 + Math.random() * 1.5; // wrong: 2-3.5
}

function runSimulation(): {
  trades: SimTrade[];
  summary: {
    totalPredictions: number;
    totalUsers: number;
    totalRevenue: number;
    avgRevenuePerUser: number;
    avgConfidence: number;
    verifiedPredictions: number;
    correctPredictions: number;
    accuracyRate: number;
    avgSatisfaction: number;
    fiveStarRate: number;
    categoryBreakdown: Record<string, { predictions: number; revenue: number; avgConfidence: number; accuracy: number }>;
    confidenceDistribution: { high: number; medium: number; low: number };
    revenueByType: Record<string, number>;
    topUsers: { name: string; predictions: number; revenue: number }[];
  };
} {
  const trades: SimTrade[] = [];
  let cycle = 0;

  for (const persona of personas) {
    for (const question of persona.questions) {
      cycle++;
      const pred = getPrediction(question);
      const confidence = pred.confidence;

      const predicted = confidence >= 0.6 ? "YES" : confidence <= 0.45 ? "NO" : "NEUTRAL";
      const { outcome, correct } = simulateOutcomes(confidence);
      const satisfaction = simulateSatisfaction(confidence, correct);
      const revenue = PRICE_PER_PREDICTION;

      trades.push({
        cycle,
        user: persona.name,
        userType: persona.type,
        question,
        confidence,
        result: pred.result,
        reasoning: pred.reasoning,
        predicted,
        actualOutcome: outcome,
        wasCorrect: correct,
        revenue,
        satisfaction: Math.round(satisfaction * 10) / 10,
      });
    }
  }

  // ── Summary ─────────────────────────────────────────────────────

  const verified = trades.filter((t) => t.wasCorrect !== null);
  const correct = trades.filter((t) => t.wasCorrect === true);
  const totalRevenue = trades.length * PRICE_PER_PREDICTION;
  const avgConf = trades.reduce((s, t) => s + t.confidence, 0) / trades.length;
  const avgSat = trades.reduce((s, t) => s + t.satisfaction, 0) / trades.length;
  const fiveStars = trades.filter((t) => t.satisfaction >= 4.5).length;

  const categoryBreakdown: Record<string, { predictions: number; revenue: number; avgConfidence: number; accuracy: number }> = {};
  for (const t of trades) {
    if (!categoryBreakdown[t.userType]) {
      categoryBreakdown[t.userType] = { predictions: 0, revenue: 0, avgConfidence: 0, accuracy: 0 };
    }
    categoryBreakdown[t.userType].predictions++;
    categoryBreakdown[t.userType].revenue += t.revenue;
    categoryBreakdown[t.userType].avgConfidence += t.confidence;
    if (t.wasCorrect === true) categoryBreakdown[t.userType].accuracy++;
  }
  for (const cat of Object.keys(categoryBreakdown)) {
    const d = categoryBreakdown[cat];
    d.avgConfidence = Math.round((d.avgConfidence / d.predictions) * 100) / 100;
    const verifiedInCat = trades.filter((t) => t.userType === cat && t.wasCorrect !== null);
    d.accuracy = verifiedInCat.length > 0 ? Math.round((d.accuracy / verifiedInCat.length) * 100) : 0;
    d.revenue = Math.round(d.revenue * 100) / 100;
  }

  const confidenceDist = { high: 0, medium: 0, low: 0 };
  for (const t of trades) {
    if (t.confidence >= 0.7) confidenceDist.high++;
    else if (t.confidence >= 0.5) confidenceDist.medium++;
    else confidenceDist.low++;
  }

  const revenueByType: Record<string, number> = {};
  for (const t of trades) {
    revenueByType[t.userType] = (revenueByType[t.userType] || 0) + t.revenue;
  }

  const userStats: Record<string, { predictions: number; revenue: number }> = {};
  for (const t of trades) {
    if (!userStats[t.user]) userStats[t.user] = { predictions: 0, revenue: 0 };
    userStats[t.user].predictions++;
    userStats[t.user].revenue += t.revenue;
  }
  const topUsers = Object.entries(userStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    trades,
    summary: {
      totalPredictions: trades.length,
      totalUsers: personas.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRevenuePerUser: Math.round((totalRevenue / personas.length) * 100) / 100,
      avgConfidence: Math.round(avgConf * 100) / 100,
      verifiedPredictions: verified.length,
      correctPredictions: correct.length,
      accuracyRate: verified.length > 0 ? Math.round((correct.length / verified.length) * 100) : 0,
      avgSatisfaction: Math.round(avgSat * 10) / 10,
      fiveStarRate: Math.round((fiveStars / trades.length) * 100),
      categoryBreakdown,
      confidenceDistribution: confidenceDist,
      revenueByType,
      topUsers,
    },
  };
}

// ── Output ──────────────────────────────────────────────────────────

console.log("═".repeat(72));
console.log("  ATLAS ORACLE — Universal Prediction Simulation");
console.log("  Serving ALL users. ANY question. ANY domain.");
console.log("═".repeat(72));
console.log();

const { trades, summary } = runSimulation();

// ── Per-user-type trade log ─────────────────────────────────────────

let currentType = "";
for (const t of trades) {
  if (t.userType !== currentType) {
    currentType = t.userType;
    const persona = personas.find((p) => p.type === currentType)!;
    console.log();
    console.log(`┌${"─".repeat(70)}┐`);
    console.log(`│  ${persona.icon}  ${persona.name.padEnd(62)}│`);
    console.log(`│  Type: ${persona.type.padEnd(64)}│`);
    const wtp = (persona as UserPersona & { willingnessToPay?: number }).willingnessToPay ?? 0;
console.log(`│  Willing to pay: $${wtp}/prediction${" ".repeat(44 - String(wtp).length)}│`);
    console.log(`└${"─".repeat(70)}┘`);
    console.log();
  }

  const confBar = "█".repeat(Math.round(t.confidence * 20)) + "░".repeat(20 - Math.round(t.confidence * 20));
  const icon = t.wasCorrect === true ? "✅" : t.wasCorrect === false ? "❌" : "➖";
  const stars = "★".repeat(Math.round(t.satisfaction)) + "☆".repeat(5 - Math.round(t.satisfaction));

  console.log(`  ${icon} Q${t.cycle}: "${t.question}"`);
  console.log(`     Confidence: [${confBar}] ${(t.confidence * 100).toFixed(0)}%`);
  console.log(`     Prediction: ${t.predicted} → ${t.result}`);
  console.log(`     Outcome: ${t.actualOutcome.padEnd(14)} │ Rating: ${stars} (${t.satisfaction})`);
  console.log();
}

// ── Summary ─────────────────────────────────────────────────────────

console.log("═".repeat(72));
console.log("  SIMULATION SUMMARY");
console.log("═".repeat(72));
console.log();

console.log("── PREDICTION METRICS ────────────────────────────────────────────────");
console.log();
console.log(`  Total Predictions:     ${summary.totalPredictions}`);
console.log(`  Unique Users:          ${summary.totalUsers}`);
console.log(`  Verified Outcomes:     ${summary.verifiedPredictions}`);
console.log(`  Correct Predictions:   ${summary.correctPredictions}`);
console.log(`  Accuracy Rate:         ${summary.accuracyRate}%`);
console.log(`  Avg Confidence:        ${(summary.avgConfidence * 100).toFixed(1)}%`);
console.log();

console.log("── REVENUE MODEL ($4.99/prediction) ──────────────────────────────────");
console.log();
console.log(`  Total Revenue:         $${summary.totalRevenue.toLocaleString()}`);
console.log(`  Avg Revenue/User:      $${summary.avgRevenuePerUser.toLocaleString()}`);
console.log(`  Monthly (1k users):    $${(summary.totalRevenue * (1000 / summary.totalUsers)).toLocaleString()}`);
console.log(`  Annual (1k users):     $${(summary.totalRevenue * (12000 / summary.totalUsers)).toLocaleString()}`);
console.log(`  Annual (10k users):    $${(summary.totalRevenue * (120000 / summary.totalUsers)).toLocaleString()}`);
console.log();

console.log("── USER SATISFACTION ─────────────────────────────────────────────────");
console.log();
console.log(`  Avg Satisfaction:      ${summary.avgSatisfaction}/5.0`);
console.log(`  5-Star Rate:           ${summary.fiveStarRate}%`);
console.log();

console.log("── CONFIDENCE DISTRIBUTION ───────────────────────────────────────────");
console.log();
console.log(`  High   (≥70%):  ${summary.confidenceDistribution.high} predictions`);
console.log(`  Medium (50-69%): ${summary.confidenceDistribution.medium} predictions`);
console.log(`  Low    (<50%):  ${summary.confidenceDistribution.low} predictions`);
console.log();

console.log("── USER TYPE BREAKDOWN ───────────────────────────────────────────────");
console.log();
for (const [type, data] of Object.entries(summary.categoryBreakdown)) {
  const persona = personas.find((p) => p.type === type)!;
  console.log(`  ${persona.icon} ${type.padEnd(14)} │ ${data.predictions} predictions │ Acc: ${data.accuracy}% │ Rev: $${data.revenue.toFixed(2)}`);
}
console.log();

console.log("── TOP USERS BY SPEND ────────────────────────────────────────────────");
console.log();
for (const u of summary.topUsers) {
  console.log(`  ${u.name.padEnd(35)} │ ${u.predictions} predictions │ $${u.revenue.toFixed(2)}`);
}
console.log();

console.log("── REVENUE BY USER TYPE ──────────────────────────────────────────────");
console.log();
for (const [type, rev] of Object.entries(summary.revenueByType).sort((a, b) => b[1] - a[1])) {
  const bar = "█".repeat(Math.round((rev / summary.totalRevenue) * 30));
  console.log(`  ${type.padEnd(14)} ${bar} $${rev.toFixed(2)}`);
}
console.log();

console.log("═".repeat(72));
console.log("  📊 THE ORACLE SERVES EVERYONE — FROM STARTUP FOUNDERS");
console.log("     TO RETIREES, ARTISTS TO STUDENTS.");
console.log(`  💰 ${summary.totalPredictions} predictions × $4.99 = $${summary.totalRevenue} total revenue`);
console.log(`  🎯 ${summary.accuracyRate}% accuracy on verified predictions`);
console.log(`  ⭐ ${summary.avgSatisfaction}/5.0 avg user satisfaction`);
console.log("═".repeat(72));
