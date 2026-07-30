"use client";

import { useState, useEffect } from "react";
import type { ProjectionResult } from "@/lib/projection";

export default function ProjectionPage() {
  const [data, setData] = useState<ProjectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/projection")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load projection"); setLoading(false); });
  }, []);

  if (loading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>;
  if (error || !data) return <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error || "No data"}</div>;

  const last = data.months[data.months.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profit Projection</h1>
        <p className="text-muted-foreground">12-month forecast based on current subscription model.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card value={`$${data.totalAnnualProfit.toLocaleString()}`} label="Annual Profit" />
        <Card value={`$${last.totalUsers.toLocaleString()}`} label="Year-End Users" />
        <Card value={`$${last.subscriptionRevenue.toFixed(2)}`} label="Month 12 Sub Rev" />
        <Card value={`${last.margin}%`} label="Month 12 Margin" />
      </div>

      <div className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">Month</th>
                <th className="p-3 text-right font-medium">Users</th>
                <th className="p-3 text-right font-medium">FREE</th>
                <th className="p-3 text-right font-medium">PRO</th>
                <th className="p-3 text-right font-medium">Predictions</th>
                <th className="p-3 text-right font-medium">Sub Rev</th>
                <th className="p-3 text-right font-medium">Pred Rev</th>
                <th className="p-3 text-right font-medium">AI Cost</th>
                <th className="p-3 text-right font-medium">Hosting</th>
                <th className="p-3 text-right font-medium">Profit</th>
                <th className="p-3 text-right font-medium">Margin</th>
                <th className="p-3 text-right font-medium">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {data.months.map((m) => (
                <tr key={m.month} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3 font-medium">{m.label}</td>
                  <td className="p-3 text-right">{m.totalUsers.toLocaleString()}</td>
                  <td className="p-3 text-right">{m.freeUsers.toLocaleString()}</td>
                  <td className="p-3 text-right">{m.proUsers.toLocaleString()}</td>
                  <td className="p-3 text-right">{m.totalPredictions.toLocaleString()}</td>
                  <td className="p-3 text-right">${m.subscriptionRevenue.toFixed(2)}</td>
                  <td className="p-3 text-right">${m.predictionRevenue.toFixed(2)}</td>
                  <td className="p-3 text-right">${m.aiCost.toFixed(2)}</td>
                  <td className="p-3 text-right">${m.hostingCost.toFixed(2)}</td>
                  <td className={`p-3 text-right font-medium ${m.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${m.grossProfit.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">{m.margin}%</td>
                  <td className={`p-3 text-right font-medium ${m.cumulativeProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${m.cumulativeProfit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border p-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Assumptions</h3>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div>Starting users: <strong>{data.input.currentUsers}</strong></div>
          <div>Monthly growth: <strong>{data.input.monthlyGrowthRate * 100}%</strong></div>
          <div>Churn rate: <strong>{data.input.churnRate * 100}%</strong></div>
          <div>FREE tier: <strong>{data.input.freeTierPercent}%</strong> ({data.input.freePredictionsPerMonth}/mo)</div>
          <div>PRO tier: <strong>{100 - data.input.freeTierPercent}%</strong> ({data.input.proPredictionsPerMonth}/mo @ ${data.input.proSubscriptionPrice})</div>
          <div>Prediction price: <strong>${data.input.predictionPrice}</strong></div>
          <div>AI cost/prediction: <strong>${data.input.aiCostPerPrediction}</strong></div>
          <div>Hosting: <strong>${data.input.monthlyHosting}/mo</strong></div>
        </div>
      </div>
    </div>
  );
}

function Card({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
