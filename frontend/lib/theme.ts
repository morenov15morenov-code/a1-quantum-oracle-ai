import { db } from "@/lib/db";
import { siteTheme } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const THEME_FONTS: Record<string, { label: string; stack: string }> = {
  system: { label: "System Sans", stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  geometric: { label: "Geometric", stack: "'Century Gothic', 'Avant Garde', Futura, 'Trebuchet MS', sans-serif" },
  serif: { label: "Classic Serif", stack: "Georgia, 'Times New Roman', 'Palatino Linotype', serif" },
  mono: { label: "Terminal Mono", stack: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  elegant: { label: "Elegant", stack: "'Palatino Linotype', 'Book Antiqua', Georgia, serif" },
};

export const THEME_RADII = ["0rem", "0.25rem", "0.5rem", "0.75rem", "1rem", "1.5rem"] as const;

export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type SiteThemeRow = typeof siteTheme.$inferSelect;

export async function getSiteTheme(): Promise<SiteThemeRow | null> {
  try {
    return await db.select().from(siteTheme).where(eq(siteTheme.id, 1)).get() ?? null;
  } catch {
    return null;
  }
}

const colorVars: Array<{ column: keyof SiteThemeRow; cssVar: string }> = [
  { column: "background", cssVar: "--color-background" },
  { column: "foreground", cssVar: "--color-foreground" },
  { column: "cardBackground", cssVar: "--color-card" },
  { column: "border", cssVar: "--color-border" },
  { column: "primary", cssVar: "--color-primary" },
  { column: "accent", cssVar: "--color-accent" },
];

export function buildThemeCss(row: SiteThemeRow | null): string {
  if (!row) return "";
  const rules: string[] = [];
  for (const { column, cssVar } of colorVars) {
    const value = row[column];
    if (typeof value === "string" && HEX_PATTERN.test(value)) {
      rules.push(`${cssVar}: ${value}`);
    }
  }
  if (typeof row.radius === "string" && (THEME_RADII as readonly string[]).includes(row.radius)) {
    rules.push(`--radius: ${row.radius}`);
  }
  let css = "";
  if (rules.length > 0) {
    css += `:root{${rules.join(";")}}`;
  }
  if (typeof row.fontFamily === "string" && THEME_FONTS[row.fontFamily]) {
    css += `body{font-family:${THEME_FONTS[row.fontFamily].stack}}`;
  }
  return css;
}
