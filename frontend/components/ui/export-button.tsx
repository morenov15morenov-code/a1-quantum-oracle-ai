"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExportButtonProps {
  limit?: boolean;
}

export function ExportButton({ limit }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport(format: "json" | "csv") {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format });
      const res = await fetch(`/api/predictions/export?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atlas-oracle-predictions.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export predictions");
    } finally {
      setLoading(false);
    }
  }

  if (limit) {
    return (
      <Button variant="outline" size="sm" onClick={() => handleExport("json")} disabled={loading}>
        {loading ? "Exporting..." : "Export All"}
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleExport("json")} disabled={loading}>
        {loading ? "Exporting..." : "Export JSON"}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport("csv")} disabled={loading}>
        {loading ? "Exporting..." : "Export CSV"}
      </Button>
    </div>
  );
}
