export interface ProjectionInput {
  currentUsers: number;
  monthlyGrowthRate: number;
  freeTierPercent: number;
  proSubscriptionPrice: number;
  predictionPrice: number;
  aiCostPerPrediction: number;
  monthlyHosting: number;
  freePredictionsPerMonth: number;
  proPredictionsPerMonth: number;
  churnRate: number;
}

export interface MonthlyProjection {
  month: number;
  label: string;
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  totalPredictions: number;
  subscriptionRevenue: number;
  predictionRevenue: number;
  aiCost: number;
  hostingCost: number;
  totalCost: number;
  grossProfit: number;
  margin: number;
  cumulativeProfit: number;
}

export interface ProjectionResult {
  input: ProjectionInput;
  months: MonthlyProjection[];
  totalAnnualProfit: number;
  avgMonthlyProfit: number;
  yearEndUsers: number;
  totalPredictions: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function calculateProjection(input: ProjectionInput): ProjectionResult {
  const months: MonthlyProjection[] = [];
  let users = input.currentUsers;
  let cumulativeProfit = 0;

  for (let i = 0; i < 12; i++) {
    const freeUsers = Math.round(users * (input.freeTierPercent / 100));
    const proUsers = users - freeUsers;

    const freePredictions = freeUsers * input.freePredictionsPerMonth;
    const proPredictions = proUsers * input.proPredictionsPerMonth;
    const totalPredictions = freePredictions + proPredictions;

    const subscriptionRevenue = proUsers * input.proSubscriptionPrice;
    const predictionRevenue = totalPredictions * input.predictionPrice;
    const aiCost = totalPredictions * input.aiCostPerPrediction;
    const hostingCost = input.monthlyHosting;
    const totalCost = aiCost + hostingCost;
    const grossProfit = subscriptionRevenue + predictionRevenue - totalCost;
    const margin = (subscriptionRevenue + predictionRevenue) > 0
      ? Math.round((grossProfit / (subscriptionRevenue + predictionRevenue)) * 10000) / 100
      : 0;

    cumulativeProfit += grossProfit;

    months.push({
      month: i + 1,
      label: MONTHS[i],
      totalUsers: Math.round(users),
      freeUsers,
      proUsers,
      totalPredictions,
      subscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100,
      predictionRevenue: Math.round(predictionRevenue * 100) / 100,
      aiCost: Math.round(aiCost * 100) / 100,
      hostingCost,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      margin,
      cumulativeProfit: Math.round(cumulativeProfit * 100) / 100,
    });

    users = users * (1 + input.monthlyGrowthRate - input.churnRate);
  }

  const totalAnnualProfit = months.reduce((s, m) => s + m.grossProfit, 0);

  return {
    input,
    months,
    totalAnnualProfit: Math.round(totalAnnualProfit * 100) / 100,
    avgMonthlyProfit: Math.round((totalAnnualProfit / 12) * 100) / 100,
    yearEndUsers: Math.round(users),
    totalPredictions: months.reduce((s, m) => s + m.totalPredictions, 0),
  };
}
