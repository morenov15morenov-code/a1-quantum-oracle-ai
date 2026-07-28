"use client";

import { useFetch } from "@/lib/use-fetch";
import type { SubscriptionData } from "@/types";

export function SubscriptionBadge() {
  const { data } = useFetch<SubscriptionData>("/api/user/subscription");

  if (!data) return null;

  const usagePercent = data.predsLimit > 0 ? (data.predsUsed / data.predsLimit) * 100 : 0;
  const isPro = data.tier === "PRO";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
      <span className={`h-2 w-2 rounded-full ${isPro ? "bg-purple-500" : "bg-blue-500"}`} />
      <span className="font-medium">{isPro ? "Pro" : "Free"}</span>
      <span className="text-muted-foreground">
        {data.predsUsed}/{data.predsLimit} predictions
      </span>
      {!isPro && usagePercent >= 80 && (
        <span className="text-xs text-amber-600 dark:text-amber-400">Almost full</span>
      )}
    </div>
  );
}
