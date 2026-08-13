import "dotenv/config";
import { queryOracle } from "../lib/oracle";
import { db } from "../lib/db";
import { predictions, users } from "../lib/schema";
import { sql, eq } from "drizzle-orm";

async function getSystemUserId(): Promise<string> {
  let sysUser = await db.select().from(users).where(eq(users.email, "oracle@system.internal")).get();
  if (!sysUser) {
    sysUser = await db.insert(users).values({
      name: "Oracle System",
      email: "oracle@system.internal",
      password: "system",
      role: "ADMIN",
    }).returning().get();
    console.log("  ✓ Created system user for simulation\n");
  }
  return sysUser.id;
}

async function seedPredictions(sysUserId: string) {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(predictions).all();
  if (existing[0].count > 0) {
    console.log(`Database already has ${existing[0].count} predictions. Using existing data.\n`);
    return;
  }

  console.log("Seeding initial predictions for learning context...\n");

  const seedQuestions = [
    { input: "Should I pivot my SaaS from B2B to B2C?", result: "The pivot is risky but shows 65% probability of success if executed within 3 months. Your current B2B customer base provides valuable insights for the B2C transition.", confidence: 0.65, reasoning: "B2B to B2C pivots have a 40% historical success rate. Your 200 existing customers provide market validation. Key risk is runway — 6 months is tight but achievable.", context: "B2B SaaS founder with 6 months runway, 200 customers, 5% MoM growth flatlining", domainCategory: "Business & Strategy", outcomeStatus: "PARTIAL" },
    { input: "Is now the right time to switch careers into UX design?", result: "Favorable conditions detected. The UX design market is growing at 15% annually and your project management background is a strong differentiator for UX research roles.", confidence: 0.82, reasoning: "UX design job postings are up 22% YoY. Your 10 years of PM experience gives you domain expertise that pure designers lack. 8 months savings provides adequate runway.", context: "34yo PM with 10yr experience, 6mo UX bootcamp, 8mo savings, partner support", domainCategory: "Career & Work", outcomeStatus: null },
    { input: "Will expanding my coffee shop to a second location be profitable?", result: "Cautiously positive. Second location expansion has 60% success probability if same-neighborhood. Your current $15k/month revenue supports a modest expansion.", confidence: 0.6, reasoning: "Coffee shop expansions within the same city have 70% success vs 30% for different cities. Portland's coffee market is competitive but your brand recognition helps.", context: "Coffee shop owner, $15k/mo revenue, 3 employees, Portland, want to expand", domainCategory: "Business & Strategy", outcomeStatus: null },
  ];

  for (const s of seedQuestions) {
    await db.insert(predictions).values({
      userId: sysUserId,
      input: s.input,
      result: s.result,
      confidence: s.confidence,
      reasoning: s.reasoning,
      context: s.context,
      domainCategory: s.domainCategory,
      outcomeStatus: s.outcomeStatus,
      model: "oracle-v1",
    }).run();
    console.log(`  ✓ Seeded: "${s.input.substring(0, 50)}..."`);
  }
  console.log(`\n${seedQuestions.length} predictions seeded.\n`);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  A1 QUANTUM ORACLE AI — Self-Learning Simulation v2");
  console.log("  With stored predictions for similarity matching");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const sysUserId = await getSystemUserId();
  await seedPredictions(sysUserId);

  // First pass: queries that should find similar past cases
  console.log("═══ PHASE 1 — Similar Case Retrieval ═════════════════════════\n");

  const phase1 = [
    {
      user: "Mike — SaaS Founder",
      input: "Should I pivot my B2B product to target a different market?",
      context: "I'm running out of runway in 4 months. Have 150 B2B customers but growth has stalled. Considering targeting healthcare vertical instead.",
      domainCategory: "Business & Strategy",
    },
    {
      user: "Emily — Career Switcher",
      input: "Is it a good idea to leave my job and start a UX career?",
      context: "30 years old, 6 years in marketing. Completed a UX certificate. Have 12 months of savings. No dependents.",
      domainCategory: "Career & Work",
    },
    {
      user: "Carlos — Restaurant Owner",
      input: "Should I open a second location for my business?",
      context: "Own a successful taco spot in Austin. $25k monthly revenue. Thinking about opening in a new neighborhood across town.",
      domainCategory: "Business & Strategy",
    },
  ];

  for (const tc of phase1) {
    console.log(`  👤  ${tc.user}`);
    console.log(`  📝  "${tc.input}"`);
    console.log(`  🏷️   ${tc.domainCategory}`);
    console.log(`  📋  ${tc.context.substring(0, 100)}...`);

    const result = await queryOracle({
      input: tc.input,
      context: tc.context,
      domainCategory: tc.domainCategory,
      userId: sysUserId,
    });

    console.log(`  🤖  ${result.result.substring(0, 180)}`);
    console.log(`  📊  ${Math.round(result.confidence * 100)}%  🔍 ${result.similarCasesUsed} similar cases found`);
    console.log(`  💡  ${result.reasoning.substring(0, 150)}`);
    console.log("");
  }

  // Phase 2: same question, DIFFERENT contexts — should produce unique answers
  console.log("═══ PHASE 2 — Uniqueness Test (same question, different people) ═══\n");

  const phase2 = [
    { user: "Priya — Student", question: "Should I pursue higher education?", context: "22 years old, BS in Computer Science, accepted to MIT for MS but $80k in debt. Have a job offer for $120k at Google.", domain: "Education" },
    { user: "James — Mid-Career", question: "Should I pursue higher education?", context: "38 years old, 15 years in marketing. Considering an Executive MBA ($150k) to transition into C-suite roles. Employer offers $30k tuition reimbursement.", domain: "Career & Work" },
    { user: "Marta — Retiree", question: "Should I pursue higher education?", context: "62 years old, retired teacher. Want to study art history for personal fulfillment. Have pension + savings. No career pressure, just passion.", domain: "Education" },
  ];

  for (const tc of phase2) {
    console.log(`  👤  ${tc.user}`);
    console.log(`  📝  "${tc.question}"`);
    console.log(`  📋  ${tc.context.substring(0, 100)}...`);

    const result = await queryOracle({
      input: tc.question,
      context: tc.context,
      domainCategory: tc.domain,
    });

    console.log(`  🤖  ${result.result.substring(0, 180)}`);
    console.log(`  📊  ${Math.round(result.confidence * 100)}%  🔍 ${result.similarCasesUsed} similar cases`);
    console.log("");
  }

  // Phase 3: store the new predictions so they're available for future learning
  console.log("═══ PHASE 3 — Storing predictions for future learning ═══════════\n");
  const allCases = [...phase1, ...phase2.map((p) => ({ user: p.user, input: p.question, context: p.context, domainCategory: p.domain }))];

  for (const tc of allCases) {
    const result = await queryOracle({ input: tc.input, context: tc.context, domainCategory: tc.domainCategory });
    await db.insert(predictions).values({
      userId: sysUserId,
      input: tc.input,
      result: result.result,
      confidence: result.confidence,
      reasoning: result.reasoning,
      context: tc.context,
      domainCategory: tc.domainCategory,
      model: "oracle-v1",
    }).run();
  }
  console.log(`  ✓ Stored ${allCases.length} new predictions into the learning database.\n`);

  // Final summary
  const total = await db.select({ count: sql<number>`count(*)` }).from(predictions).all();
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("  SIMULATION COMPLETE");
  console.log(`  Total predictions in DB now: ${total[0].count}`);
  console.log("  ✓ Similar case retrieval tested");
  console.log("  ✓ Uniqueness across different contexts tested");
  console.log("  ✓ Learning loop: predictions stored for future queries");
  console.log("\n  Run this script again to see the oracle learn from its own output!");
  console.log("═══════════════════════════════════════════════════════════════");
  process.exit(0);
}

main().catch((err) => {
  console.error("Simulation failed:", err);
  process.exit(1);
});
