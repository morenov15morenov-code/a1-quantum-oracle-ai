"use client";

import { useFetch } from "@/lib/use-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsData } from "@/types";
import { formatConfidence } from "@/lib/utils";

export function AnalyticsCharts() {
  const { data, loading } = useFetch<AnalyticsData>("/api/admin/analytics");

  if (loading) {
    return (
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
    );
  }

  if (!data) return <p className="text-muted-foreground">Failed to load analytics</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.totalUsers}</p>
          </CardContent>
        </Card>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatConfidence(data.avgConfidence)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Predictions (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {data.predictionsByDay.length > 0 ? (
                <div className="flex h-full items-end gap-1">
                  {data.predictionsByDay.map((day) => {
                    const maxCount = Math.max(...data.predictionsByDay.map((d) => d.count), 1);
                    return (
                      <div
                        key={day.date}
                        className="flex-1 rounded-t bg-primary/80 transition-all hover:bg-primary"
                        style={{ height: `${(day.count / maxCount) * 100}%` }}
                        title={`${day.date}: ${day.count} predictions`}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">New Users (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {data.usersByDay.length > 0 ? (
                <div className="flex h-full items-end gap-1">
                  {data.usersByDay.map((day) => {
                    const maxCount = Math.max(...data.usersByDay.map((d) => d.count), 1);
                    return (
                      <div
                        key={day.date}
                        className="flex-1 rounded-t bg-green-500/80 transition-all hover:bg-green-500"
                        style={{ height: `${(day.count / maxCount) * 100}%` }}
                        title={`${day.date}: ${day.count} new users`}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Models</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topModels.length > 0 ? (
              <div className="space-y-2">
                {data.topModels.map((model) => (
                  <div key={model.model} className="flex items-center justify-between">
                    <span className="text-sm">{model.model}</span>
                    <span className="text-sm font-medium">{model.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Users by Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.predictionsByUser.length > 0 ? (
              <div className="space-y-2">
                {data.predictionsByUser.map((user) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <span className="text-sm">{user.userName}</span>
                    <span className="text-sm font-medium">{user.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
