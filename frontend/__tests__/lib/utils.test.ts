import { describe, it, expect } from "vitest";
import { cn, formatDate, formatConfidence } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2026-07-08T12:00:00.000Z");
    expect(result).toContain("2026");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2026-01-01"));
    expect(result).toContain("2026");
  });
});

describe("formatConfidence", () => {
  it("formats confidence as percentage", () => {
    expect(formatConfidence(0.756)).toBe("76%");
  });

  it("handles null confidence", () => {
    expect(formatConfidence(null)).toBe("N/A");
  });

  it("handles zero confidence", () => {
    expect(formatConfidence(0)).toBe("0%");
  });

  it("handles full confidence", () => {
    expect(formatConfidence(1)).toBe("100%");
  });
});
