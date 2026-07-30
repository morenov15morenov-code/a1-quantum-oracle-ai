interface PastPrediction {
  id: string;
  input: string;
  result: string;
  confidence: number | null;
  reasoning: string | null;
  context: string | null;
  domainCategory: string | null;
  outcomeStatus: string | null;
  feedbackWasAccurate: boolean | null;
  feedbackRating: number | null;
  createdAt: Date;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function wordOverlapScore(query: string, candidate: string): number {
  const qTokens = tokenize(query);
  const cTokens = tokenize(candidate);
  return jaccardSimilarity(qTokens, cTokens);
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such", "no",
  "nor", "not", "only", "own", "same", "so", "than", "too", "very",
  "just", "because", "but", "and", "or", "if", "while", "about",
]);

function keywordOverlap(query: string, candidate: string): number {
  const qTokens = query.toLowerCase().split(/\s+/).filter((t) => !STOP_WORDS.has(t));
  const cTokens = candidate.toLowerCase().split(/\s+/).filter((t) => !STOP_WORDS.has(t));
  if (qTokens.length === 0 || cTokens.length === 0) return 0;
  const qSet = new Set(qTokens);
  const cSet = new Set(cTokens);
  const matches = [...qSet].filter((t) => cSet.has(t));
  return matches.length / Math.max(qSet.size, 1);
}

export interface SimilarPrediction {
  prediction: PastPrediction;
  score: number;
}

export function findSimilarPredictions(
  query: string,
  domainCategory: string | undefined,
  pastPredictions: PastPrediction[],
  maxResults = 5
): SimilarPrediction[] {
  const scored = pastPredictions.map((p) => {
    const jScore = wordOverlapScore(query, p.input);
    const kScore = keywordOverlap(query, p.input);
    const domainBonus = domainCategory && p.domainCategory === domainCategory ? 0.15 : 0;
    const score = jScore * 0.4 + kScore * 0.6 + domainBonus;
    return { prediction: p, score };
  });

  return scored
    .filter((s) => s.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}
