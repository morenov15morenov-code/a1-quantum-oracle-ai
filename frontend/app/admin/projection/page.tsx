"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProjectionResult, ProjectionInput } from "@/lib/projection";

const DEFAULT_INPUTS: ProjectionInput = {
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

export default function ProjectionPage() {
  const [data, setData] = useState<ProjectionResult | null>(null);
  const [inputs, setInputs] = useState<ProjectionInput>(DEFAULT_INPUTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjection = useCallback(async (params: ProjectionInput) => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        currentUsers: String(params.currentUsers),
        monthlyGrowthRate: String(params.monthlyGrowthRate),
        freeTierPercent: String(params.freeTierPercent),
        proSubscriptionPrice: String(params.proSubscriptionPrice),
        predictionPrice: String(params.predictionPrice),
        aiCostPerPrediction: String(params.aiCostPerPrediction),
        monthlyHosting: String(params.monthlyHosting),
        freePredictionsPerMonth: String(params.freePredictionsPerMonth),
        proPredictionsPerMonth: String(params.proPredictionsPerMonth),
        churnRate: String(params.churnRate),
      });
      const r = await fetch(`/api/admin/projection?${qs}`);
      if (!r.ok) throw new Error("Failed to load projection");
      const d = await r.json();
      setData(d);
    } catch {
      setError("Failed to load projection");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjection(inputs); }, [fetchProjection, inputs]);

  function update<K extends keyof ProjectionInput>(key: K, value: ProjectionInput[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function exportCsv() {
    if (!data) return;
    const headers = ["Month", "TotalUsers", "FREE", "PRO", "Predictions", "SubRev", "PredRev", "AICost", "Hosting", "Profit", "Margin", "Cumulative"];
    const rows = data.months.map((m) =>
      [m.label, m.totalUsers, m.freeUsers, m.proUsers, m.totalPredictions, m.subscriptionRevenue.toFixed(2), m.predictionRevenue.toFixed(2), m.aiCost.toFixed(2), m.hostingCost.toFixed(2), m.grossProfit.toFixed(2), m.margin, m.cumulativeProfit.toFixed(2)].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projection-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !data) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-muted" /><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>;
  if (error && !data) return <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>;

  const last = data?.months[data.months.length - 1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profit Projection</h1>
        <p className="text-muted-foreground">12-month forecast. Tweak the assumptions below and the projection updates in real-time.</p>
      </div>

      <InputPanel inputs={inputs} update={update} onExport={exportCsv} />

      {data && last && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card value={`$${data.totalAnnualProfit.toLocaleString()}`} label="Annual Profit" />
            <Card value={last.totalUsers.toLocaleString()} label="Year-End Users" />
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
        </>
      )}
    </div>
  );
}

function InputPanel({ inputs, update, onExport }: {
  inputs: ProjectionInput;
  update: <K extends keyof ProjectionInput>(key: K, value: ProjectionInput[K]) => void;
  onExport: () => void;
}) {
  return (
    <details className="rounded-xl border" open>
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium hover:bg-muted/30">Assumptions</summary>
      <div className="grid gap-3 border-t p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Current Users" type="number" value={inputs.currentUsers} onChange={(v) => update("currentUsers", Number(v))} min={0} step={1} />
        <Field label="Monthly Growth" type="number" value={inputs.monthlyGrowthRate} onChange={(v) => update("monthlyGrowthRate", Number(v))} min={0} max={1} step={0.01} />
        <Field label="Churn Rate" type="number" value={inputs.churnRate} onChange={(v) => update("churnRate", Number(v))} min={0} max={1} step={0.01} />
        <Field label="FREE Tier %" type="number" value={inputs.freeTierPercent} onChange={(v) => update("freeTierPercent", Number(v))} min={0} max={100} step={1} />
        <Field label="FREE Preds/Month" type="number" value={inputs.freePredictionsPerMonth} onChange={(v) => update("freePredictionsPerMonth", Number(v))} min={0} step={1} />
        <Field label="PRO Preds/Month" type="number" value={inputs.proPredictionsPerMonth} onChange={(v) => update("proPredictionsPerMonth", Number(v))} min={0} step={1} />
        <Field label="PRO Price ($/mo)" type="number" value={inputs.proSubscriptionPrice} onChange={(v) => update("proSubscriptionPrice", Number(v))} min={0} step={0.5} />
        <Field label="Prediction Price ($)" type="number" value={inputs.predictionPrice} onChange={(v) => update("predictionPrice", Number(v))} min={0} step={0.5} />
        <Field label="AI Cost/Prediction ($)" type="number" value={inputs.aiCostPerPrediction} onChange={(v) => update("aiCostPerPrediction", Number(v))} min={0} step={0.001} />
        <Field label="Monthly Hosting ($)" type="number" value={inputs.monthlyHosting} onChange={(v) => update("monthlyHosting", Number(v))} min={0} step={10} />
        <div className="flex items-end">
          <button onClick={onExport} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Export CSV</button>
        </div>
      </div>
    </details>
  );
}

function Field({ label, value, onChange, type, min, max, step }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  type: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
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
  const values = months.flatMap((m) => [m.grossProfit, m.cumulativeProfit]);
  const maxVal = Math.max(...values.map(Math.abs), 1);
  const padding = maxVal * 0.1;
  const max = maxVal + padding;
  const min = -padding;
  const range = max - min;
  const barW = Math.max(6, Math.min(28, 620 / months.length));
  const gap = 3;
  const chartW = months.length * (barW * 2 + gap) + 40;
  const chartH = 220;
  const zeroY = chartH / 2;

  function yScale(v: number) {
    return zeroY - (v / range) * (chartH * 0.45);
  }

  const yLabels = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = min + (range * i) / steps;
    yLabels.push(val);
  }

  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Monthly & Cumulative Profit</h3>
      <svg viewBox={`0 0 ${Math.max(chartW, 700)} ${chartH + 30}`} className="w-full" role="img" aria-label="Monthly profit bar chart">
        {yLabels.map((v) => (
          <g key={v}>
            <text x="2" y={yScale(v) + 3} textAnchor="start" className="fill-muted-foreground" fontSize="9">
              {v >= 0 ? `$${Math.round(v).toLocaleString()}` : `-$${Math.abs(Math.round(v)).toLocaleString()}`}
            </text>
            <line x1="40" y1={yScale(v)} x2={chartW} y2={yScale(v)} stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
          </g>
        ))}
        <line x1="40" y1={zeroY} x2={chartW} y2={zeroY} stroke="currentColor" strokeWidth="1" opacity="0.4" />
        {months.map((m, i) => {
          const x = i * (barW * 2 + gap) + 40;
          const gp = m.grossProfit;
          const cp = m.cumulativeProfit;
          return (
            <g key={m.label}>
              <rect x={x} y={gp >= 0 ? yScale(gp) : zeroY} width={barW} height={Math.max(Math.abs(gp) / range * chartH * 0.9, 1)} fill={gp >= 0 ? "#22c55e" : "#ef4444"} rx={2} />
              <rect x={x + barW + gap} y={cp >= 0 ? yScale(cp) : zeroY} width={barW} height={Math.max(Math.abs(cp) / range * chartH * 0.9, 1)} fill="#3b82f6" rx={2} opacity={0.7} />
              {i % 2 === 0 && <text x={x + barW + gap / 2} y={chartH + 14} textAnchor="middle" className="fill-muted-foreground" fontSize="8">{m.label}</text>}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span><span className="inline-block h-2 w-3 rounded bg-green-500 align-middle" /> Monthly Profit</span>
        <span><span className="inline-block h-2 w-3 rounded bg-blue-500 align-middle opacity-70" /> Cumulative Profit</span>
      </div>
    </div>
  );
}
