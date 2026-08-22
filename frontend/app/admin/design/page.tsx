import { DesignForm } from "@/components/admin/design-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design",
};

export default function AdminDesignPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Design Studio</h1>
        <p className="text-muted-foreground">Reshape the look of the site — colors, boxes, and fonts.</p>
      </div>
      <DesignForm />
    </div>
  );
}
