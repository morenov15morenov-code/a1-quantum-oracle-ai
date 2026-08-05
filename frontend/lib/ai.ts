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

interface QuestionParse {
  type: "yesno" | "should" | "when" | "how" | "what" | "other";
  predicate: string;
  subject: string;
}

function parseQuestion(input: string): QuestionParse {
  const clean = input.trim().replace(/[?.!\s]+$/, "");
  const yesno = clean.match(/^(WILL|IS|ARE|DOES|DO|CAN|COULD|WOULD|SHOULD|DID|HAS|HAVE|MAY|MIGHT|AM|WAS|WERE)\s+(.+)$/i);
  if (yesno) {
    const predicate = yesno[2];
    return {
      type: yesno[1].toUpperCase() === "SHOULD" ? "should" : "yesno",
      predicate,
      subject: predicate.split(/\s+/).slice(0, 4).join(" "),
    };
  }
  const when = clean.match(/^WHEN\s+(.+)$/i);
  if (when) {
    const predicate = trimAuxiliary(when[1]);
    return { type: "when", predicate, subject: predicate.split(/\s+/).slice(0, 4).join(" ") };
  }
  const how = clean.match(/^HOW\s+(.+)$/i);
  if (how) {
    const predicate = trimAuxiliary(how[1]);
    return { type: "how", predicate, subject: predicate.split(/\s+/).slice(0, 4).join(" ") };
  }
  const what = clean.match(/^(WHAT|WHO|WHY|WHERE)\s+(.+)$/i);
  if (what) {
    const predicate = trimAuxiliary(what[2]);
    return { type: "what", predicate: `${what[1]} ${predicate}`, subject: predicate.split(/\s+/).slice(0, 4).join(" ") };
  }
  return { type: "other", predicate: clean, subject: clean.split(/\s+/).slice(0, 4).join(" ") };
}

const AUXILIARY_VERBS = /^(WILL|IS|ARE|DOES|DO|CAN|COULD|WOULD|SHOULD|DID|HAS|HAVE|MAY|MIGHT|AM|WAS|WERE)\s+/i;

function trimAuxiliary(text: string): string {
  return text.replace(AUXILIARY_VERBS, "");
}

const YES_NO_VERDICTS = [
  { verdict: "Yes", confidence: 0.82 },
  { verdict: "Probably yes", confidence: 0.72 },
  { verdict: "Uncertain — the signs are mixed", confidence: 0.5 },
  { verdict: "Probably not", confidence: 0.28 },
  { verdict: "No", confidence: 0.18 },
];

const TIMING_WINDOWS = [
  "within the next three months",
  "within the next six months",
  "before the next seasonal turn",
  "sooner than you expect — within roughly a month",
  "later than expected — after a period of groundwork",
];

const ADVICE_LEADS = [
  "The favorable path opens when you act decisively",
  "The conditions are ripe, but timing and preparation matter more than force",
  "A measured, patient approach carries the strongest alignment",
  "You will need to remove an obstacle before the outcome can settle",
  "The window is closing — deliberate action is required now",
];

function generateQuestionAware(input: string, userContext: string, seed: string): PredictionResult {
  const parsed = parseQuestion(input);
  const subject = parsed.subject || input;
  const h = hashToRange(seed, 10000);
  const dimA = ANALYSIS_DIMENSIONS[h % ANALYSIS_DIMENSIONS.length];
  const dimB = ANALYSIS_DIMENSIONS[(h + 3) % ANALYSIS_DIMENSIONS.length];
  const hasContext = userContext.trim().length > 0;
  const contextRef = hasContext ? ` Your specific circumstances (${userContext.substring(0, 80)}) are woven into this reading.` : "";

  const reasoning = `The oracle layered ${dimA.substring(0, 90)}... against ${dimB.substring(0, 90)}... and then focused the field through the lens of your question about "${subject.substring(0, 60)}".${contextRef} The dominant signal was weighted by the current celestial and energetic configuration.`;

  switch (parsed.type) {
    case "yesno": {
      const v = YES_NO_VERDICTS[h % YES_NO_VERDICTS.length];
      return {
        result: `${v.verdict} — the oracle reads that "${subject.substring(0, 60).toLowerCase()}" is ${v.verdict === "Yes" || v.verdict === "Probably yes" ? "genuinely supported by the current alignment" : v.verdict === "No" || v.verdict === "Probably not" ? "not favored by the current alignment" : "poised between conflicting currents right now"}.${contextRef}`,
        confidence: v.confidence,
        reasoning,
      };
    }
    case "should": {
      const v = h % 2 === 0 ? "Yes — the reading supports it" : "No — the reading counsels caution";
      return {
        result: `${v} for "${subject.substring(0, 60).toLowerCase()}". ${ADVICE_LEADS[h % ADVICE_LEADS.length]} before committing fully.${contextRef}`,
        confidence: 0.6 + (h % 15) * 0.01,
        reasoning,
      };
    }
    case "when": {
      const window = TIMING_WINDOWS[h % TIMING_WINDOWS.length];
      return {
        result: `The oracle places "${subject.substring(0, 60).toLowerCase()}" ${window}. ${h % 2 === 0 ? "The energetic window is opening and favors forward motion." : "A preparatory phase is required first; pushing too early will misalign the outcome."}${contextRef}`,
        confidence: 0.6 + (h % 15) * 0.01,
        reasoning,
      };
    }
    case "how": {
      return {
        result: `To move through "${subject.substring(0, 60).toLowerCase()}", the oracle advises: ${ADVICE_LEADS[(h + 1) % ADVICE_LEADS.length]}. Focus on steady, visible progress rather than dramatic moves, and let the current alignment reinforce each step.${contextRef}`,
        confidence: 0.62 + (h % 15) * 0.01,
        reasoning,
      };
    }
    case "what": {
      return {
        result: `On the matter of "${subject.substring(0, 60).toLowerCase()}", the oracle sees a clear central theme emerging: ${ADVICE_LEADS[h % ADVICE_LEADS.length].toLowerCase()}. ${h % 2 === 0 ? "Expect the situation to clarify as you gather more information." : "Watch for a decisive signal near the next planetary shift."}${contextRef}`,
        confidence: 0.6 + (h % 15) * 0.01,
        reasoning,
      };
    }
    default: {
      return {
        result: `The oracle considers "${subject.substring(0, 60).toLowerCase()}" and concludes: ${ADVICE_LEADS[(h + 2) % ADVICE_LEADS.length]}. ${h % 2 === 0 ? "The overall trajectory favors a positive resolution." : "Patience is required — the alignment is still forming."}${contextRef}`,
        confidence: 0.58 + (h % 15) * 0.01,
        reasoning,
      };
    }
  }
}

function generateMockPrediction(input: string, systemPrompt?: string): PredictionResult {
  const ctxMatch = systemPrompt?.match(/USER'S PERSONAL CONTEXT:\n([\s\S]*?)(?:\n\n|\nPAST|$)/);
  const userContext = ctxMatch ? ctxMatch[1].trim() : "";
  const fullSeed = input + "|" + userContext + "|" + (systemPrompt?.substring(0, 200) || "");
  return generateQuestionAware(input, userContext, fullSeed);
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
