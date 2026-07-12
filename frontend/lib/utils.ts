import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return "N/A";
  }
}

export function formatConfidence(confidence: number | null | undefined) {
  if (confidence === null || confidence === undefined) return "N/A";
  const clamped = Math.min(1, Math.max(0, confidence));
  return `${(clamped * 100).toFixed(0)}%`;
}
