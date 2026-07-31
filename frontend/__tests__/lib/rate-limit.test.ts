import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";

vi.setConfig({ testTimeout: 30000 });

describe("rateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function callRateLimit(key: string, limit?: number, windowMs?: number): Promise<RateLimitResult> {
    const mod = await import("@/lib/rate-limit");
    return mod.rateLimit(key, limit, windowMs);
  }

  it("allows requests within limit", async () => {
    const result = await callRateLimit("test-key", 3, 60000);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks remaining count", async () => {
    await callRateLimit("remaining-key", 3, 60000);
    const second = await callRateLimit("remaining-key", 3, 60000);
    expect(second.remaining).toBe(1);
    const third = await callRateLimit("remaining-key", 3, 60000);
    expect(third.remaining).toBe(0);
  });

  it("blocks when limit exceeded", async () => {
    await callRateLimit("block-key", 2, 60000);
    await callRateLimit("block-key", 2, 60000);
    const result = await callRateLimit("block-key", 2, 60000);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", async () => {
    const key = "reset-key";
    await callRateLimit(key, 1, 50);
    await callRateLimit(key, 1, 50);
    const blocked = await callRateLimit(key, 1, 50);
    expect(blocked.success).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));
    const afterReset = await callRateLimit(key, 1, 50);
    expect(afterReset.success).toBe(true);
  });

  it("handles different keys independently", async () => {
    await callRateLimit("key-a", 1, 60000);
    const aResult = await callRateLimit("key-a", 1, 60000);
    expect(aResult.success).toBe(false);

    const bResult = await callRateLimit("key-b", 1, 60000);
    expect(bResult.success).toBe(true);
  });

  it("uses default limit of 20 when not specified", async () => {
    for (let i = 0; i < 20; i++) {
      const result = await callRateLimit(`default-${i}`, 20);
      expect(result.success).toBe(true);
    }
  });
});
