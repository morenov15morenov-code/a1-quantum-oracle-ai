"use client";

import { useState, useEffect, useCallback } from "react";
import { PredictionForm } from "@/components/forms/prediction-form";
import { PredictionResultCard } from "@/components/predictions/prediction-result";
import type { PredictionResult } from "@/types";

export default function DashboardPage() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await fetch("/api/predictions?limit=5");
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Predictions</h1>
        <p className="text-muted-foreground">
          Ask a question and get an AI-powered forecast.
        </p>
      </div>

      <PredictionForm onPredictionCreated={fetchPredictions} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Predictions</h2>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No predictions yet. Start by asking a question above.
          </p>
        ) : (
          predictions.map((p) => (
            <PredictionResultCard key={p.id} prediction={p} />
          ))
        )}
      </div>
    </div>
  );
}
