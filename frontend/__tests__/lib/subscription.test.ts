import { describe, it, expect, vi, beforeEach } from "vitest";

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

import { isAdminUser, refreshSubscription, FREE_PRED_LIMIT } from "@/lib/subscription";

function chain(result: unknown) {
  const t = {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
  return {
    from: vi.fn().mockReturnValue({ ...t, where: vi.fn().mockReturnValue({ ...t, returning: vi.fn().mockReturnValue(t) }) }),
    values: vi.fn().mockReturnValue({ ...t, returning: vi.fn().mockReturnValue(t) }),
    set: vi.fn().mockReturnValue({ ...t, where: vi.fn().mockReturnValue({ ...t, returning: vi.fn().mockReturnValue(t) }) }),
  };
}

const base = {
  id: "sub-1", userId: "user-1", tier: "FREE", status: "ACTIVE",
  predsUsed: 0, predsLimit: FREE_PRED_LIMIT, periodStart: new Date(), periodEnd: null,
};

describe("isAdminUser", () => {
  it("returns true for ADMIN role", () => {
    expect(isAdminUser({ user: { role: "ADMIN", email: "x@y.com" } })).toBe(true);
  });

  it("returns false without admin role or emails", () => {
    expect(isAdminUser({ user: { role: "USER", email: "x@y.com" } })).toBe(false);
  });

  it("returns false for empty session", () => {
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
  });

  it("matches emails listed in ADMIN_EMAILS case-insensitively", () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@atlas-oracle.com, Boss@Example.com");
    expect(isAdminUser({ user: { role: "USER", email: "ADMIN@ATLAS-ORACLE.COM" } })).toBe(true);
    expect(isAdminUser({ user: { role: "USER", email: "boss@example.com" } })).toBe(true);
    expect(isAdminUser({ user: { role: "USER", email: "other@example.com" } })).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("refreshSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a free subscription with limit 1 when none exists", async () => {
    dbMock.select.mockReturnValue(chain(null));
    dbMock.insert.mockReturnValue(chain({ ...base }));
    const sub = await refreshSubscription("user-1");
    expect(dbMock.insert).toHaveBeenCalled();
    expect(sub.predsLimit).toBe(FREE_PRED_LIMIT);
  });

  it("does not update a current free subscription at limit 1", async () => {
    dbMock.select.mockReturnValue(chain({ ...base }));
    const sub = await refreshSubscription("user-1");
    expect(dbMock.update).not.toHaveBeenCalled();
    expect(sub.predsLimit).toBe(FREE_PRED_LIMIT);
  });

  it("normalizes a stale free subscription limit of 5 to 1", async () => {
    dbMock.select.mockReturnValue(chain({ ...base, predsUsed: 3, predsLimit: 5 }));
    dbMock.update.mockReturnValue(chain({ ...base, predsUsed: 3, predsLimit: 1 }));
    const sub = await refreshSubscription("user-1");
    expect(dbMock.update).toHaveBeenCalled();
    expect(sub.predsLimit).toBe(FREE_PRED_LIMIT);
    expect(sub.predsUsed).toBe(3);
  });

  it("resets usage and limit when the weekly window elapses", async () => {
    const start = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    dbMock.select.mockReturnValue(chain({ ...base, predsUsed: 1, predsLimit: 1, periodStart: start }));
    dbMock.update.mockReturnValue(chain({ ...base, predsUsed: 0, predsLimit: 1, periodStart: new Date(), periodEnd: null }));
    const sub = await refreshSubscription("user-1");
    expect(dbMock.update).toHaveBeenCalled();
    expect(sub.predsUsed).toBe(0);
  });

  it("resets usage for a PRO subscription whose period ended", async () => {
    const past = new Date(Date.now() - 1000);
    dbMock.select.mockReturnValue(chain({ ...base, tier: "PRO", predsUsed: 50, predsLimit: 100, periodEnd: past }));
    dbMock.update.mockReturnValue(chain({ ...base, tier: "PRO", predsUsed: 0, predsLimit: 100, periodStart: new Date(), periodEnd: null }));
    const sub = await refreshSubscription("user-1");
    expect(dbMock.update).toHaveBeenCalled();
    expect(sub.predsUsed).toBe(0);
  });
});
