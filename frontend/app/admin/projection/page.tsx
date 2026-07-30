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

      <ProfitChart months={data.months} />

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

function ProfitChart({ months }: { months: { label: string; grossProfit: number; cumulativeProfit: number }[] }) {
  const max = Math.max(...months.map((m) => Math.max(m.grossProfit, m.cumulativeProfit, 1)));
  const barW = Math.max(8, Math.min(40, 680 / months.length));
  const gap = 4;

  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Monthly Profit</h3>
      <svg viewBox="0 0 700 200" className="w-full" role="img" aria-label="Monthly profit bar chart">
        {months.map((m, i) => {
          const x = i * (barW * 2 + gap) + 20;
          const barH = (Math.abs(m.grossProfit) / max) * 160;
          const y = m.grossProfit >= 0 ? 180 - barH : 180;
          const cumBarH = (Math.abs(m.cumulativeProfit) / max) * 160;
          const cumY = m.cumulativeProfit >= 0 ? 180 - cumBarH : 180;
          return (
            <g key={m.label}>
              <rect x={x} y={y} width={barW} height={Math.max(barH, 1)} fill={m.grossProfit >= 0 ? "#22c55e" : "#ef4444"} rx={2} />
              <rect x={x + barW + gap} y={cumY} width={barW} height={Math.max(cumBarH, 1)} fill="#3b82f6" rx={2} opacity={0.7} />
              {i % 2 === 0 && <text x={x + barW + gap / 2} y="195" textAnchor="middle" className="fill-muted-foreground" fontSize="8">{m.label}</text>}
            </g>
          );
        })}
        <text x="15" y="12" className="fill-muted-foreground" fontSize="9">$</text>
        <line x1="20" y1="180" x2="700" y2="180" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      </svg>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span><span className="inline-block h-2 w-3 rounded bg-green-500 align-middle" /> Monthly Profit</span>
        <span><span className="inline-block h-2 w-3 rounded bg-blue-500 align-middle opacity-70" /> Cumulative Profit</span>
      </div>
    </div>
  );
}
