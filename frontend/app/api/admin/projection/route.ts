import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calculateProjection } from "@/lib/projection";
import type { ProjectionInput } from "@/lib/projection";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const defaults: ProjectionInput = {
    currentUsers: safeInt(searchParams.get("currentUsers"), 50),
    monthlyGrowthRate: safeFloat(searchParams.get("monthlyGrowthRate"), 0.15),
    freeTierPercent: safeInt(searchParams.get("freeTierPercent"), 80),
    proSubscriptionPrice: safeFloat(searchParams.get("proSubscriptionPrice"), 19.99),
    predictionPrice: safeFloat(searchParams.get("predictionPrice"), 4.99),
    aiCostPerPrediction: safeFloat(searchParams.get("aiCostPerPrediction"), 0.02),
    monthlyHosting: safeInt(searchParams.get("monthlyHosting"), 200),
    freePredictionsPerMonth: safeInt(searchParams.get("freePredictionsPerMonth"), 5),
    proPredictionsPerMonth: safeInt(searchParams.get("proPredictionsPerMonth"), 100),
    churnRate: safeFloat(searchParams.get("churnRate"), 0.05),
  };

  const result = calculateProjection(defaults);
  return NextResponse.json(result);
}

function safeInt(val: string | null, fallback: number): number {
  if (val === null) return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

function safeFloat(val: string | null, fallback: number): number {
  if (val === null) return fallback;
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}
