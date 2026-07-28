"use client";

import { useFetch } from "@/lib/use-fetch";
import { PredictionResultCard } from "@/components/predictions/prediction-result";
import { PredictionFeedback } from "@/components/predictions/prediction-feedback";
import { useState } from "react";

interface PredictionsResponse {
  predictions: {
    id: string;
    input: string;
    result: string;
    confidence: number | null;
    reasoning: string | null;
    model: string;
    createdAt: string;
    feedback?: {
      id: string;
      rating: number;
      wasAccurate: boolean | null;
      comment: string | null;
      domain: string | null;
    } | null;
  }[];
  totalPages: number;
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch<PredictionsResponse>(
    `/api/predictions?page=${page}&limit=20`,
    [page]
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prediction History</h1>
        <p className="text-muted-foreground">
          Browse all your past predictions and their results.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data || data.predictions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No predictions yet.</p>
      ) : (
        <>
          <div className="space-y-4">
            {data.predictions.map((p) => (
              <div key={p.id} className="space-y-4">
                <PredictionResultCard prediction={p} />
                {!p.feedback && (
                  <PredictionFeedback
                    predictionId={p.id}
                    onFeedbackSubmitted={() => setPage((prev) => prev)}
                  />
                )}
              </div>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
