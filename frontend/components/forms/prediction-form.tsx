"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { predictionSchema } from "@/lib/validations";

interface PredictionFormProps {
  onPredictionCreated: () => void;
}

export function PredictionForm({ onPredictionCreated }: PredictionFormProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = predictionSchema.safeParse({ input });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to generate prediction");
        return;
      }

      setInput("");
      onPredictionCreated();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Prediction</CardTitle>
        <CardDescription>
          Ask a question or describe what you want to predict. The AI will analyze and provide a forecast.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What would you like to predict? For example: 'What will the stock market do next quarter?' or 'Will it rain tomorrow?'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{input.length}/2000</p>
          </div>

          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Generating Prediction..." : "Generate Prediction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
