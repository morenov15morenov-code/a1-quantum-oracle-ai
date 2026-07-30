import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateProjection } from "@/lib/projection";
import type { ProjectionInput } from "@/lib/projection";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const defaults: ProjectionInput = {
    currentUsers: 50,
    monthlyGrowthRate: 0.15,
    freeTierPercent: 80,
    proSubscriptionPrice: 19.99,
    predictionPrice: 4.99,
    aiCostPerPrediction: 0.02,
    monthlyHosting: 200,
    freePredictionsPerMonth: 5,
    proPredictionsPerMonth: 100,
    churnRate: 0.05,
  };

  const result = calculateProjection(defaults);
  return NextResponse.json(result);
}
