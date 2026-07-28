"use client";

import { useFetch } from "@/lib/use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatConfidence } from "@/lib/utils";
import type { UserAnalyticsData } from "@/types";

export function UserAnalyticsDashboard() {
  const { data, loading } = useFetch<UserAnalyticsData>("/api/user/analytics");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Failed to load analytics</p>;
  }

  const domainMaxCount = Math.max(...data.predictionsByDomain.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalPredictions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Feedback Given</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalFeedback}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.avgRating > 0 ? `${data.avgRating.toFixed(1)}/5` : "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accuracy Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.accuracyRate > 0 ? `${(data.accuracyRate * 100).toFixed(0)}%` : "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      {data.predictionsByDomain.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Predictions by Domain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.predictionsByDomain.map((domain) => (
                <div key={domain.domain} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{domain.domain}</span>
                    <span className="font-medium">{domain.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(domain.count / domainMaxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.ratingsByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ratings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-1" role="img" aria-label="Bar chart showing average ratings over time">
              {data.ratingsByMonth.map((month) => (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{month.avgRating.toFixed(1)}</span>
                  <div
                    className="w-full rounded-t bg-yellow-400 transition-all hover:bg-yellow-500"
                    style={{ height: `${(month.avgRating / 5) * 150}px` }}
                    title={`${month.month}: ${month.avgRating.toFixed(1)} avg rating (${month.count} feedback)`}
                  />
                  <span className="text-xs text-muted-foreground">{month.month.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.recentPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Rated Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentPredictions.map((pred) => (
                <div key={pred.id} className="flex items-start justify-between gap-4 rounded-md border p-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm truncate">{pred.input}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(pred.createdAt)}</span>
                      {pred.confidence !== null && <span>{formatConfidence(pred.confidence)} confidence</span>}
                      {pred.domain && <span className="rounded bg-muted px-1.5 py-0.5">{pred.domain}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex" aria-label={`Rating: ${pred.rating} out of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <svg
                          key={i}
                          className={`h-3 w-3 ${i < (pred.rating ?? 0) ? "text-yellow-400" : "text-muted"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    {pred.wasAccurate !== null && (
                      <span className={`text-xs ${pred.wasAccurate ? "text-green-600" : "text-red-600"}`}>
                        {pred.wasAccurate ? "Accurate" : "Inaccurate"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
