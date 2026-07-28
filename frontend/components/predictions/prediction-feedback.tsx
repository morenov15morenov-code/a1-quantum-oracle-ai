"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PredictionFeedbackData } from "@/types";

const DOMAINS = [
  "Finance", "Health", "Career", "Relationships", "Education",
  "Technology", "Politics", "Sports", "Entertainment", "Other",
];

interface PredictionFeedbackProps {
  predictionId: string;
  existingFeedback?: PredictionFeedbackData | null;
  onFeedbackSubmitted?: (feedback: PredictionFeedbackData) => void;
}

export function PredictionFeedback({ predictionId, existingFeedback, onFeedbackSubmitted }: PredictionFeedbackProps) {
  const [rating, setRating] = useState(existingFeedback?.rating ?? 0);
  const [wasAccurate, setWasAccurate] = useState<boolean | null>(existingFeedback?.wasAccurate ?? null);
  const [domain, setDomain] = useState(existingFeedback?.domain ?? "");
  const [comment, setComment] = useState(existingFeedback?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/predictions/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predictionId,
          rating,
          wasAccurate,
          domain: domain || undefined,
          comment: comment || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to save feedback");
        return;
      }

      const data = await res.json();
      setSaved(true);
      onFeedbackSubmitted?.(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (saved || existingFeedback) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Feedback saved. Thank you!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rate This Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">How useful was this prediction?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={`h-8 w-8 rounded-md text-sm font-medium transition-colors ${
                  rating >= value
                    ? "bg-yellow-400 text-yellow-900"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
                aria-label={`Rate ${value} out of 5`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Was this prediction accurate?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWasAccurate(true)}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                wasAccurate === true
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Yes
            </button>
            <button
              type="button"
              onClick={() => setWasAccurate(false)}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                wasAccurate === false
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              No
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor={`domain-${predictionId}`} className="text-sm font-medium">Domain (optional)</label>
          <select
            id={`domain-${predictionId}`}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select a domain...</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor={`comment-${predictionId}`} className="text-sm font-medium">Comment (optional)</label>
          <textarea
            id={`comment-${predictionId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Any additional thoughts..."
            maxLength={500}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading || rating === 0} size="sm">
          {loading ? "Saving..." : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}
