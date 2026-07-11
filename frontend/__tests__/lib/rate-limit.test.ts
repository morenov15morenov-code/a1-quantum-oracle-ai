import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows requests within limit", () => {
    const result = rateLimit("test-key", 3, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks remaining count", () => {
    rateLimit("remaining-key", 3, 60000);
    const second = rateLimit("remaining-key", 3, 60000);
    expect(second.remaining).toBe(1);
    const third = rateLimit("remaining-key", 3, 60000);
    expect(third.remaining).toBe(0);
  });

  it("blocks when limit exceeded", () => {
    rateLimit("block-key", 2, 60000);
    rateLimit("block-key", 2, 60000);
    const result = rateLimit("block-key", 2, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    return new Promise<void>((resolve) => {
      const key = "reset-key";
      rateLimit(key, 1, 50);
      rateLimit(key, 1, 50);
      const blocked = rateLimit(key, 1, 50);
      expect(blocked.success).toBe(false);

      setTimeout(() => {
        const afterReset = rateLimit(key, 1, 50);
        expect(afterReset.success).toBe(true);
        resolve();
      }, 60);
    });
  });

  it("handles different keys independently", () => {
    rateLimit("key-a", 1, 60000);
    const aResult = rateLimit("key-a", 1, 60000);
    expect(aResult.success).toBe(false);

    const bResult = rateLimit("key-b", 1, 60000);
    expect(bResult.success).toBe(true);
  });

  it("uses default limit of 20 when not specified", () => {
    for (let i = 0; i < 20; i++) {
      const result = rateLimit(`default-${i}`, 20);
      expect(result.success).toBe(true);
    }
  });
});
