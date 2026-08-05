"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DOMAIN_OPTIONS = [
  "Career & Work",
  "Finance & Investing",
  "Health & Wellness",
  "Relationships",
  "Education",
  "Business & Strategy",
  "Creative & Arts",
  "Technology",
  "Personal Growth",
  "Family & Parenting",
  "Other",
];

interface PredictionFormProps {
  onPredictionCreated: () => void;
}

export function PredictionForm({ onPredictionCreated }: PredictionFormProps) {
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [domainCategory, setDomainCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (input.trim().length < 10) {
      setError("Question must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, context: context || undefined, domainCategory: domainCategory || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to generate prediction");
        return;
      }

      setInput("");
      setContext("");
      setDomainCategory("");
      onPredictionCreated();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="cosmic-card">
      <CardHeader>
        <CardTitle>Consult the Oracle</CardTitle>
        <CardDescription>
          Provide as much context as possible for a unique, personalized prediction. The more detail you share, the more accurate your answer will be.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="domain-category" className="text-sm font-medium">
              Domain
            </label>
            <select
              id="domain-category"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={domainCategory}
              onChange={(e) => setDomainCategory(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a domain... (optional)</option>
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="prediction-input" className="text-sm font-medium">
              Your Question <span className="text-destructive">*</span>
            </label>
            <textarea
              id="prediction-input"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="What do you want to know? Be specific..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              maxLength={2000}
              aria-describedby="char-count"
            />
            <p id="char-count" className="text-xs text-muted-foreground text-right">{input.length}/2000</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="prediction-context" className="text-sm font-medium">
              Your Context & Background
            </label>
            <textarea
              id="prediction-context"
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell the Oracle about yourself and your situation. Include relevant details like your background, timeline, constraints, goals, and any factors that make your case unique. For example: 'I'm a 32-year-old software engineer with 8 years of experience considering a move from San Francisco to Austin...'"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              disabled={loading}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground">{context.length}/5000 &mdash; The more context you provide, the more unique and accurate your prediction will be</p>
          </div>

          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? "Consulting the Oracle..." : "Get Prediction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
