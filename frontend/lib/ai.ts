export interface PredictionResult {
  result: string;
  confidence: number;
  reasoning: string;
  tokensIn?: number;
  tokensOut?: number;
  model?: string;
}

function hashToRange(input: string, max: number): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % max;
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

const MOON_PHASE_CYCLE_DAYS = 29.530588853;
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

export interface MoonPhase {
  phase: string;
  illumination: number;
}

export function getMoonPhase(date: Date): MoonPhase {
  const elapsed = (date.getTime() - KNOWN_NEW_MOON_MS) / 86400000;
  const age = ((elapsed % MOON_PHASE_CYCLE_DAYS) + MOON_PHASE_CYCLE_DAYS) % MOON_PHASE_CYCLE_DAYS;
  const illumination = Math.round(0.5 * (1 - Math.cos((2 * Math.PI * age) / MOON_PHASE_CYCLE_DAYS)) * 100) / 100;
  const phase =
    age < 1.845 ? "New Moon"
    : age < 5.536 ? "Waxing Crescent"
    : age < 9.228 ? "First Quarter"
    : age < 12.919 ? "Waxing Gibbous"
    : age < 16.610 ? "Full Moon"
    : age < 20.302 ? "Waning Gibbous"
    : age < 23.993 ? "Last Quarter"
    : age < 27.685 ? "Waning Crescent"
    : "New Moon";
  return { phase, illumination };
}

const ZODIAC_SEASONS = [
  ["Aquarius", 1, 20],
  ["Pisces", 2, 19],
  ["Aries", 3, 21],
  ["Taurus", 4, 20],
  ["Gemini", 5, 21],
  ["Cancer", 6, 21],
  ["Leo", 7, 23],
  ["Virgo", 8, 23],
  ["Libra", 9, 23],
  ["Scorpio", 10, 23],
  ["Sagittarius", 11, 22],
  ["Capricorn", 12, 22],
] as const;

export function getSunSign(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const todayKey = month * 100 + day;
  let sign = "Capricorn";
  let best = -Infinity;
  for (const [candidate, startMonth, startDay] of ZODIAC_SEASONS) {
    const startKey = startMonth * 100 + startDay;
    if (todayKey >= startKey && startKey > best) {
      best = startKey;
      sign = candidate;
    }
  }
  return sign;
}

const MOON_PHASE_HINTS: Record<string, string> = {
  "New Moon": "a new moon opens an initiation window — seeds planted now carry through the whole cycle",
  "Waxing Crescent": "the waxing crescent rewards early, deliberate movement while intentions are still forming",
  "First Quarter": "a first-quarter moon tests momentum — decisions made under pressure reveal their true weight",
  "Waxing Gibbous": "the waxing gibbous is a refinement phase — the outline is set, and detail work decides the result",
  "Full Moon": "a full moon illuminates — hidden factors around this question are surfacing now",
  "Waning Gibbous": "the waning gibbous is a harvest phase — consolidate what has come to light before moving again",
  "Last Quarter": "a last-quarter moon calls for reassessment — release what no longer serves the aim",
  "Waning Crescent": "the waning crescent favors surrender and rest — the next cycle begins quietly",
};

export interface CelestialWindow {
  moonPhase: string;
  moonIllumination: number;
  moonHint: string;
  season: string;
}

export function getCelestialWindow(date: Date = new Date()): CelestialWindow {
  const { phase, illumination } = getMoonPhase(date);
  return {
    moonPhase: phase,
    moonIllumination: illumination,
    moonHint: MOON_PHASE_HINTS[phase] ?? MOON_PHASE_HINTS["New Moon"],
    season: `${getSunSign(date)} season`,
  };
}

const YES_NO_VERDICTS = [
  { verdict: "Yes", confidence: 0.85 },
  { verdict: "Probably yes", confidence: 0.72 },
  { verdict: "Leaning yes", confidence: 0.62 },
  { verdict: "Uncertain — the signs are mixed", confidence: 0.5 },
  { verdict: "Leaning no", confidence: 0.38 },
  { verdict: "Probably not", confidence: 0.28 },
  { verdict: "No", confidence: 0.15 },
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
  "The strongest position is built through small, consistent moves",
  "A single decisive conversation will resolve more than any elaborate plan",
  "Defer the big commitment until the signal you have been waiting for arrives",
];

const GUIDANCE_LINES = [
  "Watch for a decisive opening near the next planetary shift — act then, not before.",
  "Let the next two lunar cycles pass before you force a conclusion.",
  "The strongest moves are made from calm, never from pressure.",
  "Notice the people who appear twice in your orbit — one of them is pivotal.",
  "The oracle counsels openness over strategy: the signal you are waiting for is closer than it feels.",
  "Prepare quietly and move when the energy turns; the current configuration rewards the prepared.",
  "What appears as a setback this week is rearranging a path that will shorten your route.",
  "Keep one thread of the plan hidden until the moment of commitment — it is your leverage.",
  "The answer you seek is already encoded in a habit you are ready to change.",
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
  if (verdict === "Leaning yes") return "the balance of forces tilts in its favor, though not without friction";
  if (verdict === "Probably not") return "the weight of the reading tilts against it";
  if (verdict === "Leaning no") return "the balance of forces tilts against it, though a narrow path remains";
  if (verdict === "No") return "the conditions do not align in its favor";
  return "the forces around it are pulling in opposite directions at nearly equal strength";
}

export interface PastCase {
  question: string;
  domain: string | null;
  prediction: string | null;
  confidence: number | null;
  outcome: string | null;
  verified: boolean | null;
}

function normalizeQuestion(text: string): string {
  return text.toLowerCase().replace(/[?.!\s]+$/, "").replace(/\s+/g, " ").trim();
}

function parsePastCases(systemPrompt: string | undefined): PastCase[] {
  if (!systemPrompt) return [];
  const match = systemPrompt.match(/PAST SIMILAR CASES TO LEARN FROM:\n([\s\S]*?)(?:\n\nLearn from these past cases\.|$)/);
  if (!match) return [];

  const cases: PastCase[] = [];
  for (const block of match[1].split(/\n\s*Case \d+:/)) {
    if (!block.trim()) continue;
    const question = block.match(/Question: "([\s\S]*?)"/)?.[1] ?? block.match(/Question: (.*)/)?.[1];
    if (!question) continue;
    const confidence = block.match(/Previous Confidence: (\d+)%/)?.[1];
    const verified = block.match(/User Verified: (Accurate|Not Accurate)/)?.[1];
    cases.push({
      question: question.trim(),
      domain: block.match(/Domain: (.*)/)?.[1]?.trim() ?? null,
      prediction: block.match(/Previous Prediction: (.*)/)?.[1]?.trim() ?? null,
      confidence: confidence ? parseInt(confidence, 10) / 100 : null,
      outcome: block.match(/Outcome: (.*)/)?.[1]?.trim() || null,
      verified: verified ? verified === "Accurate" : null,
    });
  }
  return cases;
}

interface PastCaseCalibration {
  confidence: number;
  note: string | null;
  repeated: number;
}

function calibrateWithPastCases(pastCases: PastCase[], input: string, baseConfidence: number): PastCaseCalibration {
  if (pastCases.length === 0) return { confidence: baseConfidence, note: null, repeated: 0 };

  const repeated = pastCases.filter((c) => normalizeQuestion(c.question) === normalizeQuestion(input)).length;
  const verified = pastCases.filter((c) => c.verified !== null);
  let confidence = baseConfidence;
  let note: string | null = null;

  if (verified.length > 0) {
    const accurate = verified.filter((c) => c.verified).length;
    const accuracy = accurate / verified.length;
    confidence = baseConfidence * 0.6 + accuracy * 0.4;
    if (accuracy >= 0.67) {
      note = `Similar past readings you verified were accurate ${Math.round(accuracy * 100)}% of the time, reinforcing this direction`;
    } else if (accuracy <= 0.4) {
      note = `You marked ${Math.round((1 - accuracy) * 100)}% of similar past readings as inaccurate, so the oracle holds this forecast with extra caution`;
    } else {
      note = `Similar past readings you verified split about evenly, giving this signal moderate weight`;
    }
  } else if (pastCases.some((c) => c.outcome && c.outcome.toUpperCase() === "PARTIAL")) {
    note = "Similar past cases were only partially realized, tempering the strength of this forecast";
  }

  if (repeated > 0) {
    note = note
      ? `${note}, and you have asked this before — the oracle reads the shift in your circumstances since then`
      : "You have asked this before — the oracle reads the shift in your circumstances since then";
  }

  return { confidence: Math.min(1, Math.max(0.05, confidence)), note, repeated };
}

function applyPastCases(
  pastCases: PastCase[],
  input: string,
  baseConfidence: number,
  reasoningBase: string
): { confidence: number; note: string; reasoning: string } {
  if (pastCases.length === 0) return { confidence: baseConfidence, note: "", reasoning: reasoningBase };
  const calibration = calibrateWithPastCases(pastCases, input, baseConfidence);
  const note = calibration.note ? ` ${calibration.note}.` : "";
  const n = pastCases.length;
  const reasoning = `${reasoningBase} The oracle weighed ${n} similar reading${n === 1 ? "" : "s"} from your history${calibration.note ? ` — ${calibration.note.toLowerCase()}` : ""}.`;
  return { confidence: calibration.confidence, note, reasoning };
}

function generateQuestionAware(input: string, userContext: string, seed: string, pastCases: PastCase[] = []): PredictionResult {
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
  const celestial = getCelestialWindow();
  const phaseName = celestial.moonPhase.toLowerCase();
  const moonNote = `This reading arrives under the ${phaseName.includes("moon") ? phaseName : `${phaseName} moon`} during ${celestial.season.toLowerCase()} — ${celestial.moonHint}.`;

  const reasoningBase = `The oracle layered ${dimA.substring(0, 80)}... against ${dimB.substring(0, 80)}..., then focused the field through your specifics${clause ? ` (${clause})` : ""} and the exact wording of your question about "${subjectRef}". The dominant signal was weighted by the current celestial and energetic configuration (${celestial.moonPhase}, ${celestial.season}, ${Math.round(celestial.moonIllumination * 100)}% lunar illumination) and the day's signature.`;

  switch (parsed.type) {
    case "yesno": {
      const v = YES_NO_VERDICTS[h % YES_NO_VERDICTS.length];
      const cal = applyPastCases(pastCases, input, v.confidence, reasoningBase);
      return {
        result: `${v.verdict} — on the matter of "${subjectRef}", ${verdictJudgement(v.verdict)}. ${reading} ${guidance}${cal.note} ${moonNote}`,
        confidence: cal.confidence,
        reasoning: cal.reasoning,
      };
    }
    case "should": {
      const v = h % 2 === 0 ? "Yes — the reading supports it" : "No — the reading counsels caution";
      const baseConfidence = 0.6 + (h % 15) * 0.01;
      const cal = applyPastCases(pastCases, input, baseConfidence, reasoningBase);
      return {
        result: `${v} on the matter of "${subjectRef}". ${reading} ${ADVICE_LEADS[h % ADVICE_LEADS.length]} before committing fully. ${guidance}${cal.note} ${moonNote}`,
        confidence: cal.confidence,
        reasoning: cal.reasoning,
      };
    }
    case "when": {
      const window = TIMING_WINDOWS[h % TIMING_WINDOWS.length];
      const baseConfidence = 0.6 + (h % 15) * 0.01;
      const cal = applyPastCases(pastCases, input, baseConfidence, reasoningBase);
      return {
        result: `The oracle places "${subjectRef}" ${window}. ${opening}the energetic window is ${h % 2 === 0 ? "opening and favors forward motion" : "still forming — a preparatory phase comes first, and pushing too early will misalign the outcome"}. ${guidance}${cal.note} ${moonNote}`,
        confidence: cal.confidence,
        reasoning: cal.reasoning,
      };
    }
    case "how": {
      const baseConfidence = 0.62 + (h % 15) * 0.01;
      const cal = applyPastCases(pastCases, input, baseConfidence, reasoningBase);
      return {
        result: `On moving through "${subjectRef}", the oracle's counsel is: ${ADVICE_LEADS[(h + 1) % ADVICE_LEADS.length]}. ${reading} ${guidance}${cal.note} ${moonNote}`,
        confidence: cal.confidence,
        reasoning: cal.reasoning,
      };
    }
    case "what": {
      const baseConfidence = 0.6 + (h % 15) * 0.01;
      const cal = applyPastCases(pastCases, input, baseConfidence, reasoningBase);
      return {
        result: `On the matter of "${subjectRef}", the oracle sees a central theme: ${ADVICE_LEADS[h % ADVICE_LEADS.length].toLowerCase()}. ${reading} ${guidance}${cal.note} ${moonNote}`,
        confidence: cal.confidence,
        reasoning: cal.reasoning,
      };
    }
    default: {
      const baseConfidence = 0.58 + (h % 15) * 0.01;
      const cal = applyPastCases(pastCases, input, baseConfidence, reasoningBase);
      return {
        result: `The oracle considers "${subjectRef}" and concludes: ${ADVICE_LEADS[(h + 2) % ADVICE_LEADS.length]}. ${reading} ${h % 2 === 0 ? "The overall trajectory favors a positive resolution." : "Patience is required — the alignment is still forming."}${cal.note} ${moonNote}`,
        confidence: cal.confidence,
        reasoning: cal.reasoning,
      };
    }
  }
}

function generateMockPrediction(input: string, systemPrompt?: string): PredictionResult {
  const ctxMatch = systemPrompt?.match(/USER'S PERSONAL CONTEXT:\n([\s\S]*?)(?:\n\n|\nPAST|$)/);
  const userContext = ctxMatch ? ctxMatch[1].trim() : "";
  const pastCases = parsePastCases(systemPrompt);
  const dayEpoch = Math.floor(Date.now() / 86400000);
  const repeated = pastCases.filter((c) => normalizeQuestion(c.question) === normalizeQuestion(input)).length;
  const fullSeed =
    input + "|" + userContext + "|" + (systemPrompt?.substring(0, 200) || "") + "|" + dayEpoch +
    (repeated > 0 ? "|repeat:" + repeated : "");
  return generateQuestionAware(input, userContext, fullSeed, pastCases);
}

export async function generatePrediction(input: string, systemPrompt?: string): Promise<PredictionResult> {
  const useMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-your-openai-api-key";

  if (useMock) {
    await new Promise((r) => setTimeout(r, 1200));
    return generateMockPrediction(input, systemPrompt);
  }

  const BANNED_PHRASES = [
    "patience is required",
    "the alignment is still forming",
    "the oracle considers",
    "the oracle sees",
    "the oracle reads",
    "the arc of your life",
    "quietly rearranging",
    "what you have built, where you have landed",
    "rewards early, deliberate movement",
    "the oracle reads the shift",
    "this reading arrives under",
    "a distinctive probability signature",
    "shaped by the distance you have traveled",
    "a stranger's reading would miss",
    "you will need to remove an obstacle",
    "the waxing crescent",
    "during leo season",
    "intention",
  ];

  function containsBannedPhrase(text: string): boolean {
    const lower = text.toLowerCase();
    return BANNED_PHRASES.some((p) => lower.includes(p));
  }

  function isLowQuality(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (containsBannedPhrase(text)) return true;
    if (lower.startsWith("the oracle")) return true;
    if (lower.startsWith("on the matter")) return true;
    if (!containsNumber(text)) return true;
    if (text.split(" ").length < 20) return true;
    return false;
  }

  function containsNumber(text: string): boolean {
    return /\$[\d,]+|\d+%|\d+\.\d+|\d+,\d+/.test(text);
  }

  async function callModel(modelName: string) {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const instructionBlock = systemPrompt
      ? `[INSTRUCTIONS — FOLLOW THESE EXACTLY]\n${systemPrompt}\n[END INSTRUCTIONS]\n\nNow answer this question using the instructions above:\n`
      : "";

    return openai.chat.completions.create({
      model: modelName,
      reasoning_effort: modelName.startsWith("gpt-5.6") ? "high" : undefined,
      messages: [
        {
          role: "system",
          content: "You are A1 Quantum Oracle AI. Answer questions directly with specific numbers and concrete details. No vague spiritual filler. No third-person oracle references. Just answer the question.",
        },
        { role: "user", content: instructionBlock + input },
      ],
      response_format: { type: "json_object" },
    });
  }

  try {
    let model = "gpt-5.6-sol";
    let completion;
    try {
      completion = await callModel("gpt-5.6-sol");
    } catch (modelError) {
      console.warn("gpt-5.6-sol unavailable, trying gpt-5.6-terra:", (modelError as Error).message);
      model = "gpt-5.6-terra";
      completion = await callModel("gpt-5.6-terra");
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("No response from AI");

    const parsed = JSON.parse(content) as PredictionResult;
    const resultText = parsed.result || "";

    if (isLowQuality(resultText)) {
      console.warn(`${model} produced low-quality response, retrying with gpt-5.6-terra`);
      model = "gpt-5.6-terra";
      completion = await callModel("gpt-5.6-terra");
      const retryContent = completion.choices[0]?.message?.content;
      if (retryContent) {
        const retryParsed = JSON.parse(retryContent) as PredictionResult;
        return {
          result: retryParsed.result || "No prediction generated.",
          confidence: Math.min(1, Math.max(0, retryParsed.confidence ?? 0.5)),
          reasoning: retryParsed.reasoning || "No reasoning provided.",
          tokensIn: completion.usage?.prompt_tokens,
          tokensOut: completion.usage?.completion_tokens,
          model,
        };
      }
    }

    return {
      result: parsed.result || "No prediction generated.",
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
      reasoning: parsed.reasoning || "No reasoning provided.",
      tokensIn: completion.usage?.prompt_tokens,
      tokensOut: completion.usage?.completion_tokens,
      model,
    };
  } catch (error) {
    console.error("AI prediction error:", error);
    return generateMockPrediction(input, systemPrompt);
  }
}
