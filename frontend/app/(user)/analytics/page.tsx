import type { Metadata } from "next";
import { UserAnalyticsDashboard } from "@/components/analytics/user-analytics";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Your Analytics</h1>
        <p className="text-muted-foreground">
          Track your prediction accuracy, ratings, and domain expertise.
        </p>
      </div>
      <UserAnalyticsDashboard />
    </div>
  );
}
