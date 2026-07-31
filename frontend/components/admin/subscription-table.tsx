"use client";

import { useFetch } from "@/lib/use-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SubscriptionRow {
  id: string;
  userId: string;
  email: string;
  name: string;
  tier: string;
  status: string;
  predsUsed: number;
  predsLimit: number;
  periodStart: string;
  periodEnd: string | null;
}

export function SubscriptionTable() {
  const { data, loading } = useFetch<{ subscriptions: SubscriptionRow[] }>("/api/admin/subscriptions");
  const router = useRouter();

  async function decide(userId: string, status: "ACTIVE" | "REJECTED") {
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      console.error("Failed to update subscription");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const rows = data?.subscriptions ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions ({rows.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Subscriptions management table">
            <caption className="sr-only">List of all user subscriptions</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="pb-3 font-medium text-muted-foreground">User</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Tier</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Status</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Usage</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Period Start</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((sub) => (
                <tr key={sub.id} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{sub.name}</div>
                    <div className="text-xs text-muted-foreground">{sub.email}</div>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.tier === "PRO" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {sub.tier}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === "ACTIVE"
                        ? "bg-green-500/10 text-green-600"
                        : sub.status === "PENDING"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-red-500/10 text-red-600"
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {sub.predsUsed} / {sub.predsLimit}
                  </td>
                  <td className="py-3 text-muted-foreground">{formatDate(sub.periodStart)}</td>
                  <td className="py-3">
                    {sub.tier === "PRO" && sub.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => decide(sub.userId, "ACTIVE")}>
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => decide(sub.userId, "REJECTED")}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
