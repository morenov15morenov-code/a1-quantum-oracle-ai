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

const GUIDANCE_LINES = [
  "Watch for a decisive opening near the next planetary shift — act then, not before.",
  "Let the next two lunar cycles pass before you force a conclusion.",
  "The strongest moves are made from calm, never from pressure.",
  "Notice the people who appear twice in your orbit — one of them is pivotal.",
  "The oracle counsels openness over strategy: the signal you are waiting for is closer than it feels.",
  "Prepare quietly and move when the energy turns; the current configuration rewards the prepared.",
];

interface ContextFacts {
  age: number | null;
  places: string[];
  traits: string[];
}

const TRAIT_DICTIONARY: Record<string, string> = {
  smart: "sharp mind",
  intelligent: "sharp mind",
  clever: "sharp mind",
  witty: "wit",
  fun: "light-hearted energy",
  funny: "light-hearted energy",
  fair: "sense of fairness",
  kind: "kindness",
  loyal: "loyalty",
  honest: "honesty",
  ambitious: "ambition",
  creative: "creativity",
  hardworking: "work ethic",
  driven: "drive",
  caring: "warmth",
  outgoing: "warmth",
  romantic: "romantic nature",
  stable: "stability",
  generous: "generosity",
  thoughtful: "thoughtfulness",
  genuine: "genuineness",
  authentic: "authenticity",
};

const PLACE_KEYS = [
  "sao paulo", "rio de janeiro", "new york", "los angeles", "san francisco", "mexico city", "united kingdom",
  "united states", "south korea", "south africa", "new zealand", "north america", "south america", "saudi arabia",
  "ho chi minh", "hong kong", "kuala lumpur", "abu dhabi", "tel aviv", "cape town", "buenos aires", "santiago",
  "sydney", "melbourne", "brisbane", "perth", "adelaide", "canberra", "auckland", "wellington", "toronto",
  "vancouver", "montreal", "seattle", "chicago", "miami", "houston", "dallas", "boston", "denver", "austin",
  "london", "manchester", "edinburgh", "dublin", "paris", "berlin", "munich", "amsterdam", "brussels", "madrid",
  "barcelona", "rome", "milan", "zurich", "geneva", "stockholm", "oslo", "copenhagen", "helsinki", "lisbon",
  "vienna", "prague", "warsaw", "istanbul", "dubai", "doha", "cairo", "johannesburg", "lagos", "nairobi",
  "tokyo", "osaka", "seoul", "beijing", "shanghai", "singapore", "bangkok", "manila", "jakarta", "hanoi",
  "taipei", "mumbai", "delhi", "bangalore", "chile", "argentina", "brazil", "colombia", "peru", "mexico",
  "spain", "italy", "france", "germany", "england", "scotland", "wales", "ireland", "portugal", "netherlands",
  "belgium", "switzerland", "austria", "sweden", "norway", "denmark", "finland", "greece", "turkey", "poland",
  "ukraine", "russia", "india", "china", "japan", "korea", "indonesia", "malaysia", "thailand", "vietnam",
  "philippines", "australia", "canada", "america", "uae", "qatar", "israel", "morocco", "egypt", "nigeria",
  "ghana", "kenya", "europe", "asia", "africa", "oceania",
].sort((a, b) => b.length - a.length);

function extractContextFacts(userContext: string): ContextFacts {
  const clean = userContext.trim();
  if (!clean) return { age: null, places: [], traits: [] };

  const ageMatch = clean.match(/\b(\d{1,3})\s*years?\s*old\b/i);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

  const lower = clean.toLowerCase();
  const traits: string[] = [];
  for (const [key, label] of Object.entries(TRAIT_DICTIONARY)) {
    if (new RegExp(`\\b${key}\\b`, "i").test(lower) && !traits.includes(label)) traits.push(label);
    if (traits.length >= 3) break;
  }

  const foundPlaces: { key: string; index: number }[] = [];
  for (const key of PLACE_KEYS) {
    const m = new RegExp(`\\b${key}\\b`, "i").exec(lower);
    if (m) foundPlaces.push({ key, index: m.index });
  }
  foundPlaces.sort((a, b) => a.index - b.index);
  const places = [...new Set(foundPlaces.map((p) => p.key))].slice(0, 2);

  return { age, places, traits };
}

function buildFactsClause(facts: ContextFacts): string {
  const parts: string[] = [];
  if (facts.age) parts.push(`at ${facts.age}`);
  if (facts.places.length >= 2) parts.push(`after crossing between ${facts.places[0]} and ${facts.places[1]}`);
  else if (facts.places.length === 1) parts.push(`now building a life in ${facts.places[0]}`);
  if (facts.traits.length >= 2) parts.push(`carrying your ${facts.traits[0]} and your ${facts.traits[1]}`);
  else if (facts.traits.length === 1) parts.push(`carrying your ${facts.traits[0]}`);
  return parts.join(", ");
}

const READINGS = [
  (subject: string, opening: string) =>
    `${opening}the arc of your life has been quietly rearranging the conditions this question depends on — what you have built, where you have landed, and who you have become all weigh on the outcome.`,
  (subject: string, opening: string) =>
    `${opening}your position in the present — shaped by the distance you have traveled and the qualities you carry — gives "${subject}" a distinctive probability signature that a stranger's reading would miss.`,
  (subject: string, opening: string) =>
    `${opening}the currents surrounding "${subject}" bend toward whatever you have been planting over the last year; this alignment rewards preparation and presence far more than luck.`,
];

function verdictJudgement(verdict: string): string {
  if (verdict === "Yes") return "the conditions are genuinely aligned in its favor";
  if (verdict === "Probably yes") return "the weight of the reading tilts toward it";
  if (verdict === "Probably not") return "the weight of the reading tilts against it";
  if (verdict === "No") return "the conditions do not align in its favor";
  return "the forces around it are pulling in opposite directions at nearly equal strength";
}

function generateQuestionAware(input: string, userContext: string, seed: string): PredictionResult {
  const parsed = parseQuestion(input);
  const subject = (parsed.predicate || parsed.subject || input).toLowerCase();
  const subjectRef = subject.substring(0, 90);
  const h = hashToRange(seed, 10000);
  const facts = extractContextFacts(userContext);
  const clause = buildFactsClause(facts);
  const opening = clause ? `${clause.charAt(0).toUpperCase()}${clause.slice(1)}, ` : "";
  const dimA = ANALYSIS_DIMENSIONS[h % ANALYSIS_DIMENSIONS.length];
  const dimB = ANALYSIS_DIMENSIONS[(h + 3) % ANALYSIS_DIMENSIONS.length];
  const reading = READINGS[h % READINGS.length](subjectRef, opening);
  const guidance = GUIDANCE_LINES[(h + 2) % GUIDANCE_LINES.length];

  const reasoning = `The oracle layered ${dimA.substring(0, 80)}... against ${dimB.substring(0, 80)}..., then focused the field through your specifics${clause ? ` (${clause})` : ""} and the exact wording of your question about "${subjectRef}". The dominant signal was then weighted by the current celestial and energetic configuration.`;

  switch (parsed.type) {
    case "yesno": {
      const v = YES_NO_VERDICTS[h % YES_NO_VERDICTS.length];
      return {
        result: `${v.verdict} — on the matter of "${subjectRef}", ${verdictJudgement(v.verdict)}. ${reading} ${guidance}`,
        confidence: v.confidence,
        reasoning,
      };
    }
    case "should": {
      const v = h % 2 === 0 ? "Yes — the reading supports it" : "No — the reading counsels caution";
      return {
        result: `${v} on the matter of "${subjectRef}". ${reading} ${ADVICE_LEADS[h % ADVICE_LEADS.length]} before committing fully. ${guidance}`,
        confidence: 0.6 + (h % 15) * 0.01,
        reasoning,
      };
    }
    case "when": {
      const window = TIMING_WINDOWS[h % TIMING_WINDOWS.length];
      return {
        result: `The oracle places "${subjectRef}" ${window}. ${opening}the energetic window is ${h % 2 === 0 ? "opening and favors forward motion" : "still forming — a preparatory phase comes first, and pushing too early will misalign the outcome"}. ${guidance}`,
        confidence: 0.6 + (h % 15) * 0.01,
        reasoning,
      };
    }
    case "how": {
      return {
        result: `On moving through "${subjectRef}", the oracle's counsel is: ${ADVICE_LEADS[(h + 1) % ADVICE_LEADS.length]}. ${reading} ${guidance}`,
        confidence: 0.62 + (h % 15) * 0.01,
        reasoning,
      };
    }
    case "what": {
      return {
        result: `On the matter of "${subjectRef}", the oracle sees a central theme: ${ADVICE_LEADS[h % ADVICE_LEADS.length].toLowerCase()}. ${reading} ${guidance}`,
        confidence: 0.6 + (h % 15) * 0.01,
        reasoning,
      };
    }
    default: {
      return {
        result: `The oracle considers "${subjectRef}" and concludes: ${ADVICE_LEADS[(h + 2) % ADVICE_LEADS.length]}. ${reading} ${h % 2 === 0 ? "The overall trajectory favors a positive resolution." : "Patience is required — the alignment is still forming."}`,
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
