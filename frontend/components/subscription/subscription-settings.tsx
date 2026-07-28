"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriptionData } from "@/types";

export function SubscriptionSettings() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/user/subscription", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setSubscription(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function handleUpgrade(tier: "FREE" | "PRO") {
    setUpgrading(true);
    setError("");
    try {
      const res = await fetch("/api/user/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to update subscription");
        return;
      }
      const data = await res.json();
      setSubscription(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setUpgrading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (!subscription) return null;

  const isPro = subscription.tier === "PRO";
  const usagePercent = subscription.predsLimit > 0
    ? (subscription.predsUsed / subscription.predsLimit) * 100
    : 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={isPro ? "border-purple-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              Free
            </CardTitle>
            <CardDescription>5 predictions per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
              <li>AI-powered forecasts</li>
              <li>Prediction history</li>
              <li>Feedback tracking</li>
            </ul>
            {!isPro ? (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Current plan</p>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleUpgrade("FREE")}
                disabled={upgrading}
              >
                Downgrade
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={isPro ? "border-purple-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              Pro
            </CardTitle>
            <CardDescription>100 predictions per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="mb-4 space-y-2 text-sm text-muted-foreground">
              <li>Everything in Free</li>
              <li>Priority AI processing</li>
              <li>Advanced analytics</li>
              <li>Domain breakdown</li>
            </ul>
            {isPro ? (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Current plan</p>
            ) : (
              <Button
                onClick={() => handleUpgrade("PRO")}
                disabled={upgrading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {upgrading ? "Upgrading..." : "Upgrade to Pro"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage This Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Predictions used</span>
            <span className="font-medium">{subscription.predsUsed} / {subscription.predsLimit}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                usagePercent >= 80 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, usagePercent)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {isPro
              ? "Resets monthly. Contact support for additional predictions."
              : `${subscription.predsLimit - subscription.predsUsed} predictions remaining. Upgrade to Pro for more.`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
