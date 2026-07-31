import type { Metadata } from "next";
import { SubscriptionTable } from "@/components/admin/subscription-table";

export const metadata: Metadata = {
  title: "Subscription Management",
};

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground">
          Review and approve pending PRO upgrade requests.
        </p>
      </div>
      <SubscriptionTable />
    </div>
  );
}
