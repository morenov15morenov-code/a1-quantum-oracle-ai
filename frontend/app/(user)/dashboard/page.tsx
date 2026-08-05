"use client";

import { useState, useEffect, useCallback } from "react";
import { PredictionForm } from "@/components/forms/prediction-form";
import { PredictionResultCard } from "@/components/predictions/prediction-result";
import { PredictionFeedback } from "@/components/predictions/prediction-feedback";
import { SubscriptionBadge } from "@/components/subscription/subscription-badge";
import type { PredictionResult } from "@/types";

export default function DashboardPage() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPredictions = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/predictions?limit=5", { signal });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data.predictions ?? []);
      } else {
        setError("Failed to load predictions.");
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchPredictions resets state on mount; abort cleans up
    fetchPredictions(controller.signal);
    return () => controller.abort();
  }, [fetchPredictions]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Predictions</h1>
          <p className="text-muted-foreground">
            Ask a question and get an AI-powered forecast.
          </p>
        </div>
        <SubscriptionBadge />
      </div>

      <PredictionForm onPredictionCreated={fetchPredictions} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Predictions</h2>
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton-card h-32" />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No predictions yet. Start by asking a question above.
          </p>
        ) : (
          predictions.map((p) => (
            <div key={p.id} className="space-y-4">
              <PredictionResultCard prediction={p} />
              {!p.feedback && (
                <PredictionFeedback
                  predictionId={p.id}
                  onFeedbackSubmitted={() => fetchPredictions()}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
