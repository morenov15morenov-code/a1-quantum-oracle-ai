"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FONTS = [
  { value: "system", label: "System Sans" },
  { value: "geometric", label: "Geometric" },
  { value: "serif", label: "Classic Serif" },
  { value: "mono", label: "Terminal Mono" },
  { value: "elegant", label: "Elegant" },
];

const RADII = [
  { value: "0rem", label: "Sharp (0)" },
  { value: "0.25rem", label: "Subtle" },
  { value: "0.5rem", label: "Default" },
  { value: "0.75rem", label: "Soft" },
  { value: "1rem", label: "Rounded" },
  { value: "1.5rem", label: "Bubble" },
];

const COLOR_FIELDS = [
  { key: "background", label: "Page Background" },
  { key: "foreground", label: "Text Color" },
  { key: "cardBackground", label: "Boxes / Cards" },
  { key: "border", label: "Box Borders" },
  { key: "primary", label: "Primary Buttons" },
  { key: "accent", label: "Accent Highlights" },
] as const;

type ThemeState = Partial<Record<(typeof COLOR_FIELDS)[number]["key"], string>> & {
  radius?: string;
  fontFamily?: string;
};

const EMPTY: ThemeState = {};

export function DesignForm() {
  const [theme, setTheme] = useState<ThemeState>(EMPTY);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then((data) => {
        if (data?.theme) {
          const { id, updatedAt, ...rest } = data.theme;
          setTheme(rest);
        }
      })
      .catch(() => {});
  }, []);

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setStatus("saved");
      setMessage("Design saved. Reloading...");
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="design-colors">
        <h2 id="design-colors" className="text-lg font-semibold mb-4">Colors</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-sm">{label}</span>
              <Input
                type="color"
                data-testid={`theme-${key}`}
                aria-label={label}
                value={theme[key] || "#000000"}
                onChange={(e) => setTheme((t) => ({ ...t, [key]: e.target.value }))}
                className="h-9 w-16 cursor-pointer p-1"
              />
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="design-boxes">
        <h2 id="design-boxes" className="text-lg font-semibold mb-4">Boxes</h2>
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3 max-w-md">
          <span className="text-sm">Corner Roundness</span>
          <select
            data-testid="theme-radius"
            aria-label="Corner roundness"
            value={theme.radius || ""}
            onChange={(e) => setTheme((t) => ({ ...t, radius: e.target.value }))}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Site default</option>
            {RADII.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section aria-labelledby="design-fonts">
        <h2 id="design-fonts" className="text-lg font-semibold mb-4">Font</h2>
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3 max-w-md">
          <span className="text-sm">Typeface</span>
          <select
            data-testid="theme-font"
            aria-label="Typeface"
            value={theme.fontFamily || ""}
            onChange={(e) => setTheme((t) => ({ ...t, fontFamily: e.target.value }))}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Site default</option>
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={status === "saving"} data-testid="theme-save">
          {status === "saving" ? "Saving..." : "Save Design"}
        </Button>
        {message && (
          <span className={status === "error" ? "text-destructive text-sm" : "text-muted-foreground text-sm"} role="status">
            {message}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground max-w-xl">
        Changes apply site-wide after save. Empty/default selections keep the built-in look.
      </p>
    </div>
  );
}
