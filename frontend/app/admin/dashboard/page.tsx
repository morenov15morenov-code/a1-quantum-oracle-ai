import type { Metadata } from "next";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of platform analytics and metrics.
        </p>
      </div>
      <AnalyticsCharts />
    </div>
  );
}
