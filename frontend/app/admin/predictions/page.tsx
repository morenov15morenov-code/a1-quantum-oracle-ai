"use client";

import { useFetch } from "@/lib/use-fetch";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatConfidence } from "@/lib/utils";

interface PredictionRow {
  id: string;
  input: string;
  confidence: number | null;
  model: string;
  createdAt: string;
  user: { name: string } | null;
}

interface PredictionsResponse {
  predictions: PredictionRow[];
  totalPages: number;
}

export default function AdminPredictionsPage() {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch<PredictionsResponse>(
    `/api/admin/predictions?page=${page}&limit=20`,
    [page]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Predictions</h1>
        <p className="text-muted-foreground">
          View all predictions made across the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !data || data.predictions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No predictions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">User</th>
                    <th className="pb-3 font-medium text-muted-foreground">Input</th>
                    <th className="pb-3 font-medium text-muted-foreground">Confidence</th>
                    <th className="pb-3 font-medium text-muted-foreground">Model</th>
                    <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.predictions.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-3">{p.user?.name ?? "Unknown"}</td>
                      <td className="max-w-xs truncate py-3 text-muted-foreground">
                        {p.input}
                      </td>
                      <td className="py-3">{formatConfidence(p.confidence)}</td>
                      <td className="py-3 text-muted-foreground">{p.model}</td>
                      <td className="py-3 text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
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
        </CardContent>
      </Card>
    </div>
  );
}
