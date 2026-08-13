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

  const isPro = subscription.tier === "PRO" && subscription.status === "ACTIVE";
  const isPending = subscription.tier === "PRO" && subscription.status === "PENDING";
  const isUnlimited = subscription.unlimited === true;
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

      {isPending && (
        <div className="rounded-md bg-yellow-500/15 p-3 text-sm text-yellow-700 dark:text-yellow-400" role="status">
          Your PRO upgrade is pending approval. You will be notified once an administrator reviews it.
        </div>
      )}

      {isUnlimited && (
        <div className="rounded-md bg-purple-500/15 p-3 text-sm text-purple-700 dark:text-purple-400" role="status">
          You have unlimited predictions as an administrator. No usage limits apply to this account.
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
            {isUnlimited ? (
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Unlimited (admin)</p>
            ) : isPro ? (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Current plan</p>
            ) : isPending ? (
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending approval</p>
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
            {isUnlimited ? (
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Unlimited (admin)</p>
            ) : isPro ? (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Current plan</p>
            ) : isPending ? (
              <Button
                variant="outline"
                onClick={() => handleUpgrade("FREE")}
                disabled={upgrading}
              >
                Cancel Request
              </Button>
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
          {isUnlimited ? (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Unlimited predictions — no usage limits on this account.
            </p>
          ) : (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
