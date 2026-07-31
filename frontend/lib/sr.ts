const NOAA_KP_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-actual.json";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface SRBand {
  name: "theta" | "alpha" | "beta" | "gamma";
  minKp: number;
  maxKp: number;
  confidence: number;
}

const SR_BANDS: SRBand[] = [
  { name: "theta", minKp: 0, maxKp: 3, confidence: 0.6 },
  { name: "alpha", minKp: 3, maxKp: 5, confidence: 0.675 },
  { name: "beta", minKp: 5, maxKp: 7, confidence: 0.825 },
  { name: "gamma", minKp: 7, maxKp: 9, confidence: 0.95 },
];

interface CachedData {
  kp: number;
  timestamp: string;
  band: "theta" | "alpha" | "beta" | "gamma";
  bandConfidence: number;
  cachedAt: number;
}

let cache: CachedData | null = null;

export function getSRBand(kp: number): { band: SRBand["name"]; confidence: number } {
  const clamped = Math.max(0, Math.min(9, kp));
  for (const b of SR_BANDS) {
    if (clamped >= b.minKp && clamped < b.maxKp) {
      return { band: b.name, confidence: b.confidence };
    }
  }
  const last = SR_BANDS[SR_BANDS.length - 1];
  return { band: last.name, confidence: last.confidence };
}

export function calculateNRI(kp: number, confidence: number, temporalStability: number): number {
  const kpNormalized = Math.max(0, Math.min(1, kp / 9));
  const nri = kpNormalized * 0.3 + confidence * 0.4 + temporalStability * 0.3;
  return Math.round(Math.max(0, Math.min(1, nri)) * 1000) / 1000;
}

export async function fetchSchumannData(): Promise<{
  kp: number;
  timestamp: string;
  band: "theta" | "alpha" | "beta" | "gamma";
  bandConfidence: number;
}> {
  if (cache && Date.now() - cache.cachedAt < CACHE_TTL_MS) {
    return {
      kp: cache.kp,
      timestamp: cache.timestamp,
      band: cache.band,
      bandConfidence: cache.bandConfidence,
    };
  }

  try {
    const res = await fetch(NOAA_KP_URL, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`NOAA API returned ${res.status}`);

    const data = await res.json();
    const latest = Array.isArray(data) && data.length > 1 ? data[data.length - 1] : null;

    if (!latest || latest.length < 2) throw new Error("Invalid NOAA response shape");

    const kp = parseFloat(latest[1]) || 3;
    const timestamp = latest[0] || new Date().toISOString();
    const { band, confidence } = getSRBand(kp);

    const cached: CachedData = { kp, timestamp, band, bandConfidence: confidence, cachedAt: Date.now() };
    cache = cached;

    return { kp, timestamp, band, bandConfidence: confidence };
  } catch {
    const fallback: CachedData = {
      kp: 3,
      timestamp: new Date().toISOString(),
      band: "alpha",
      bandConfidence: 0.675,
      cachedAt: Date.now(),
    };
    cache = fallback;
    return { kp: fallback.kp, timestamp: fallback.timestamp, band: fallback.band, bandConfidence: fallback.bandConfidence };
  }
}
