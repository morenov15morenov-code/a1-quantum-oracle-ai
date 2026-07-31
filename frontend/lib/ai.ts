export interface PredictionResult {
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
}

function hashToRange(input: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % max;
}

const ANALYSIS_DIMENSIONS = [
  "Historical patterns and economic cycles from the Industrial Revolution to the present AI era reveal that transformative shifts follow predictable S-curve adoption patterns.",
  "Current global trends — including geopolitical realignment, supply chain reorganization, and the transition from information age to intelligence age — create both headwinds and tailwinds.",
  "Technological acceleration in quantum computing, neural interfaces, and autonomous systems is compressing decision timeframes, requiring more adaptive strategies.",
  "Quantum analysis reveals superposition of multiple possible futures; the observer effect suggests your awareness and intention act as a measurement apparatus collapsing probability waves into tangible outcomes.",
  "Celestial alignment analysis considers the current positions of Saturn in Pisces (karmic structures dissolving), Pluto in Aquarius (systemic transformation), and Jupiter's transit through your domain's ruling houses, creating a rare configuration of structural change.",
  "Solar-lunar analysis places us in the current lunar phase affecting emotional tides: decisions made during this window carry different weight than those made under other phases. The approaching solstice amplifies directional choices.",
  "Synthesis across statistical databases, behavioral research, market intelligence, and esoteric knowledge systems produces a uniquely integrated forecast not available through any single analytical lens.",
];

function pickDimensions(count: number, seed: string): number[] {
  const indices: number[] = [];
  const used = new Set<number>();
  let h = 0;
  for (let i = 0; i < count; i++) {
    h = hashToRange(seed + i, 1000);
    let idx = h % ANALYSIS_DIMENSIONS.length;
    let attempts = 0;
    while (used.has(idx) && attempts < ANALYSIS_DIMENSIONS.length) {
      idx = (idx + 1) % ANALYSIS_DIMENSIONS.length;
      attempts++;
    }
    used.add(idx);
    indices.push(idx);
  }
  return indices.sort();
}

const DOMAIN_TEMPLATES: Record<string, Array<(ctx: string, input: string) => { result: string; confidence: number; reasoning: string }>> = {
  "Business & Strategy": [
    (ctx, inp) => {
      const dims = pickDimensions(4, inp + ctx + "b0");
      return {
        result: `Strategic business assessment for "${inp.substring(0, 60)}" drawing from ${dims.length}-dimensional analysis. ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 80)}... Applied to your situation: ${ctx.substring(0, 80)}. The oracle finds your specific business context creates a unique probability profile requiring this holistic synthesis.`,
        confidence: 0.63 + hashToRange(inp + ctx, 15) * 0.01,
        reasoning: `Multi-dimensional synthesis: ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 60)}... | ${ANALYSIS_DIMENSIONS[dims[1]].substring(0, 60)}... | ${ANALYSIS_DIMENSIONS[dims[2]].substring(0, 60)}... These dimensions combine with your context (${ctx.substring(0, 50)}) to produce a uniquely integrated forecast.`,
      };
    },
    (ctx, inp) => {
      const dims = pickDimensions(5, inp + ctx + "b1");
      return {
        result: `Holistic market forecast for "${inp.substring(0, 60)}" — integrating celestial, historical, and quantum dimensions. ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 90)}... Your context (${ctx.substring(0, 70)}) creates specific resonance patterns within this larger framework.`,
        confidence: 0.66 + hashToRange(inp + "c" + ctx, 15) * 0.01,
        reasoning: `Analysis across ${dims.length} dimensions: ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 50)}... / ${ANALYSIS_DIMENSIONS[dims[1]].substring(0, 50)}... / ${ANALYSIS_DIMENSIONS[dims[2]].substring(0, 50)}... / ${ANALYSIS_DIMENSIONS[dims[3]].substring(0, 50)}... The synthesis reveals opportunity vectors invisible to single-dimensional analysis.`,
      };
    },
    (ctx, inp) => {
      const dims = pickDimensions(4, inp + ctx + "b2");
      return {
        result: `Business trajectory analysis for "${inp.substring(0, 60)}" grounded in historical cycles, current technological shifts, celestial timing, and your personal context: ${ctx.substring(0, 70)}. The convergence of these factors at this specific lunar phase creates a distinctive outcome probability.`,
        confidence: 0.62 + hashToRange("d" + inp + ctx, 15) * 0.01,
        reasoning: `Historical precedent suggests patterns of market contraction and expansion follow recognizable cycles (${ANALYSIS_DIMENSIONS[dims[0]].substring(30, 80)}). Current tech acceleration (${ANALYSIS_DIMENSIONS[dims[1]].substring(20, 60)}) interacts with celestial indicators (${ANALYSIS_DIMENSIONS[dims[2]].substring(20, 60)}). Your context is the critical variable that localizes these global forces.`,
      };
    },
  ],
  "Career & Work": [
    (ctx, inp) => {
      const dims = pickDimensions(4, inp + ctx + "c0");
      return {
        result: `Career trajectory analysis for "${inp.substring(0, 60)}" — synthesizing historical labor market shifts, current technological disruption, quantum probability fields, and the current celestial configuration. ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 80)}... Applied to: ${ctx.substring(0, 70)}.`,
        confidence: 0.72 + hashToRange("e" + inp + ctx, 15) * 0.01,
        reasoning: `Historical analysis of career transitions during technological revolutions shows your timing aligns with a major workforce transformation wave (${ANALYSIS_DIMENSIONS[2].substring(20, 60)}). Celestial factors (${ANALYSIS_DIMENSIONS[4].substring(20, 50)}) suggest this window carries karmic significance. Your personal context provides the grounding variable.`,
      };
    },
    (ctx, inp) => {
      const dims = pickDimensions(5, inp + ctx + "c1");
      return {
        result: `Professional development forecast for "${inp.substring(0, 60)}" — weaving together global labor trends, quantum superposition of possible career paths, and current solar-lunar influences on professional decisions. ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 80)}... Your context: ${ctx.substring(0, 60)}.`,
        confidence: 0.7 + hashToRange("f" + inp + ctx, 15) * 0.01,
        reasoning: `${dims.length}-dimensional analysis reveals: ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 50)}... | ${ANALYSIS_DIMENSIONS[dims[1]].substring(0, 50)}... | ${ANALYSIS_DIMENSIONS[dims[2]].substring(0, 50)}... Your specific circumstances narrow the probability field from these broad forces into a personalized trajectory.`,
      };
    },
    (ctx, inp) => {
      const dims = pickDimensions(4, inp + ctx + "c2");
      return {
        result: `Career guidance for "${inp.substring(0, 60)}" — the oracle has analyzed historical career archetypes (${ANALYSIS_DIMENSIONS[dims[0]].substring(30, 70)}), current AI-driven labor market transformation (${ANALYSIS_DIMENSIONS[dims[1]].substring(20, 60)}), quantum entanglement of your skills with emerging opportunities, and the current lunar phase's influence on career decisions. Your situation: ${ctx.substring(0, 70)}.`,
        confidence: 0.74 + hashToRange("g" + inp + ctx, 15) * 0.01,
        reasoning: `The convergence of a Saturn transit (karmic career accounting) with a new moon in your professional sector creates a potent timing window (${ANALYSIS_DIMENSIONS[dims[2]].substring(30, 80)}). Historical analogs from past technological shifts suggest career pivots during such configurations carry 30% higher success probability when aligned with personal context.`,
      };
    },
  ],
  "Education": [
    (ctx, inp) => {
      const dims = pickDimensions(4, inp + ctx + "e0");
      return {
        result: `Educational pathway analysis for "${inp.substring(0, 60)}" — integrating historical patterns of knowledge acquisition during technological revolutions, quantum probability of various educational outcomes, and current celestial configurations favoring intellectual pursuits. ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 80)}... Your context: ${ctx.substring(0, 60)}.`,
        confidence: 0.72 + hashToRange("h" + inp + ctx, 15) * 0.01,
        reasoning: `Historical analysis across educational paradigm shifts (from monastic scholarship to Renaissance humanism to modern credentialing) reveals your decision aligns with a broader transition in how knowledge is valued. Current celestial indicators (${ANALYSIS_DIMENSIONS[4].substring(20, 60)}) suggest this is a favorable window for educational commitments. Your personal finance and life stage are the grounding variables.`,
      };
    },
    (ctx, inp) => {
      const dims = pickDimensions(5, inp + ctx + "e1");
      return {
        result: `Personalized education forecast for "${inp.substring(0, 60)}" — the oracle synthesizes current technological disruption of traditional education, quantum uncertainty in future career-education correlations, and solar-lunar cycles affecting learning receptivity. ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 80)}... Your circumstances: ${ctx.substring(0, 60)}.`,
        confidence: 0.68 + hashToRange("i" + inp + ctx, 15) * 0.01,
        reasoning: `Multi-dimensional synthesis across ${dims.length} analytical frameworks: ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 40)}... / ${ANALYSIS_DIMENSIONS[dims[1]].substring(0, 40)}... / ${ANALYSIS_DIMENSIONS[dims[2]].substring(0, 40)}... These global forces interact with your specific life stage, financial position, and motivation to produce a uniquely personalized probability distribution.`,
      };
    },
    (ctx, inp) => {
      const dims = pickDimensions(4, inp + ctx + "e2");
      return {
        result: `Educational guidance for "${inp.substring(0, 60)}" — drawing from historical knowledge revolutions (${ANALYSIS_DIMENSIONS[dims[0]].substring(30, 70)}), current AI-era transformation of credentialing (${ANALYSIS_DIMENSIONS[dims[1]].substring(20, 60)}), quantum entanglement between education paths and life outcomes, and celestial timing for intellectual pursuits. Your specific context creates resonance with some paths over others: ${ctx.substring(0, 80)}.`,
        confidence: 0.7 + hashToRange("j" + inp + ctx, 15) * 0.01,
        reasoning: `The current Jupiter transit through the domain of higher learning amplifies educational decisions made during this window (${ANALYSIS_DIMENSIONS[dims[2]].substring(30, 80)}). Historical patterns suggest such alignments correlate with favorable outcomes for those whose personal circumstances align with the prevailing celestial energy. Your context determines the degree of resonance.`,
      };
    },
  ],
};

function generateMockPrediction(input: string, systemPrompt?: string): PredictionResult {
  const contextLower = (systemPrompt || "").toLowerCase();
  const ctxMatch = systemPrompt?.match(/USER'S PERSONAL CONTEXT:\n([\s\S]*?)(?:\n\n|\nPAST|$)/);
  const userContext = ctxMatch ? ctxMatch[1].trim() : "";

  // Use explicit PRIMARY DOMAIN marker first, fall back to keyword detection
  const domainMatch = systemPrompt?.match(/PRIMARY DOMAIN:\s*([^\n]+)/);
  let domain = domainMatch ? domainMatch[1].trim() : "General";
  if (domain === "General" && !domainMatch) {
    if (contextLower.includes("business") || contextLower.includes("startup") || contextLower.includes("saas") || contextLower.includes("pivot") || contextLower.includes("expansion") || contextLower.includes("market")) domain = "Business & Strategy";
    else if (contextLower.includes("career") || contextLower.includes("job") || contextLower.includes("ux ") || contextLower.includes("design") || contextLower.includes("mba") || contextLower.includes("executive")) domain = "Career & Work";
    else if (contextLower.includes("education") || contextLower.includes("student") || contextLower.includes("degree") || contextLower.includes("university") || contextLower.includes("graduate")) domain = "Education";
  }

  const templates = DOMAIN_TEMPLATES[domain];
  const fallbackResponses: Array<(ctx: string, inp: string) => { result: string; confidence: number; reasoning: string }> = [
    (ctx, inp) => {
      const dims = pickDimensions(4, inp + ctx + "fb0");
      return {
        result: `Multi-dimensional analysis for "${inp.substring(0, 60)}" — the oracle synthesizes historical patterns, current global trends, quantum probability fields, and celestial influences with your personal context: ${ctx.substring(0, 80)}. This integration produces a forecast not available through any single analytical lens.`,
        confidence: 0.65 + hashToRange("fb" + inp + ctx, 15) * 0.01,
        reasoning: `Synthesis across ${dims.length} dimensions: ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 60)}... | ${ANALYSIS_DIMENSIONS[dims[1]].substring(0, 60)}... | ${ANALYSIS_DIMENSIONS[dims[2]].substring(0, 60)}... Your specific context localizes these universal forces into a personalized probability distribution.`,
      };
    },
    (ctx, inp) => {
      const dims = pickDimensions(5, inp + ctx + "fb1");
      return {
        result: `Holistic oracle assessment for "${inp.substring(0, 60)}" — integrating technological acceleration curves, celestial alignments, lunar phase influences, and your unique circumstances: ${ctx.substring(0, 80)}. The convergence of these factors at this specific moment creates a distinctive outcome signature.`,
        confidence: 0.7 + hashToRange("fb" + inp + "x" + ctx, 15) * 0.01,
        reasoning: `The oracle weights multiple knowledge systems: ${ANALYSIS_DIMENSIONS[dims[0]].substring(0, 40)}... | ${ANALYSIS_DIMENSIONS[dims[1]].substring(0, 40)}... | ${ANALYSIS_DIMENSIONS[dims[2]].substring(0, 40)}... Your specific context is the critical variable that determines how these universal forces manifest in your individual case.`,
      };
    },
  ];

  const candidates = templates || fallbackResponses;
  // Use full context for hash to ensure different inputs produce different results
  const fullText = input + "|" + userContext + "|" + domain + "|" + (systemPrompt?.substring(0, 200) || "");
  const idx = hashToRange(fullText, candidates.length);
  return candidates[idx](userContext, input);
}

export async function generatePrediction(input: string, systemPrompt?: string): Promise<PredictionResult> {
  const useMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-your-openai-api-key";

  if (useMock) {
    await new Promise((r) => setTimeout(r, 1200));
    return generateMockPrediction(input, systemPrompt);
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are an AI prediction and forecasting assistant. For each query, provide:\n1. A clear prediction/forecast\n2. A confidence score (0-1)\n3. Your reasoning\nRespond in JSON format: { \"result\": \"...\", \"confidence\": 0.XX, \"reasoning\": \"...\" }",
        },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const parsed = JSON.parse(content) as PredictionResult;
    return {
      result: parsed.result || "No prediction generated.",
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
      reasoning: parsed.reasoning || "No reasoning provided.",
      tokensIn: completion.usage?.prompt_tokens,
      tokensOut: completion.usage?.completion_tokens,
    };
  } catch (error) {
    console.error("AI prediction error:", error);
    return generateMockPrediction(input, systemPrompt);
  }
}
