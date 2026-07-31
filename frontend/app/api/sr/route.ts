import { NextResponse } from "next/server";
import { fetchSchumannData, calculateNRI } from "@/lib/sr";

export async function GET() {
  const data = await fetchSchumannData();
  const nri = calculateNRI(data.kp, data.bandConfidence, 0.75);

  return NextResponse.json({
    kp: data.kp,
    timestamp: data.timestamp,
    band: data.band,
    bandConfidence: data.bandConfidence,
    nri,
    bands: {
      theta: data.band === "theta" ? data.bandConfidence : 0.6,
      alpha: data.band === "alpha" ? data.bandConfidence : 0.675,
      beta: data.band === "beta" ? data.bandConfidence : 0.825,
      gamma: data.band === "gamma" ? data.bandConfidence : 0.95,
    },
  });
}
