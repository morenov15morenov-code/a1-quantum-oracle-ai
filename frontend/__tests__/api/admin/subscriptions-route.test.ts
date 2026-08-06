import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/admin/subscriptions/route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 29 }),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

function mockChain(result: unknown) {
  const terminal = {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
  return {
    from: vi.fn().mockReturnValue({
      ...terminal,
      innerJoin: vi.fn().mockReturnValue({ ...terminal }),
      where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }),
    }),
    values: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }),
    set: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }) }),
  };
}

function createGetRequest() {
  return new Request("http://localhost:3000/api/admin/subscriptions", { method: "GET" });
}

function createPatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/admin/subscriptions", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

describe("Admin Subscriptions API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  });

  it("returns all subscriptions with user info", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([{
      id: "sub-1", userId: "user-1", email: "alice@test.com", name: "Alice",
      tier: "PRO", status: "PENDING", predsUsed: 3, predsLimit: 5,
    }]));
    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.subscriptions).toHaveLength(1);
    expect(body.subscriptions[0].email).toBe("alice@test.com");
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await GET(createGetRequest());
    expect(response.status).toBe(403);
  });
});

describe("Admin Subscriptions API - PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    dbMock.insert.mockReturnValue(mockChain(null));
  });

  it("approves a pending PRO request", async () => {
    dbMock.select.mockReturnValueOnce(mockChain({
      id: "sub-1", userId: "user-1", tier: "PRO", status: "PENDING", predsUsed: 0, predsLimit: 5, periodStart: new Date(), periodEnd: null,
    }));
    dbMock.update.mockReturnValueOnce(mockChain({
      id: "sub-1", userId: "user-1", tier: "PRO", status: "ACTIVE", predsUsed: 0, predsLimit: 100, periodStart: new Date(), periodEnd: null,
    }));
    const response = await PATCH(createPatchRequest({ userId: "user-1", status: "ACTIVE" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.subscription.status).toBe("ACTIVE");
    expect(body.subscription.predsLimit).toBe(100);
  });

  it("rejects a pending PRO request", async () => {
    dbMock.select.mockReturnValueOnce(mockChain({
      id: "sub-1", userId: "user-1", tier: "PRO", status: "PENDING", predsUsed: 0, predsLimit: 5, periodStart: new Date(), periodEnd: null,
    }));
    dbMock.update.mockReturnValueOnce(mockChain({
      id: "sub-1", userId: "user-1", tier: "PRO", status: "REJECTED", predsUsed: 0, predsLimit: 1, periodStart: new Date(), periodEnd: null,
    }));
    const response = await PATCH(createPatchRequest({ userId: "user-1", status: "REJECTED" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.subscription.status).toBe("REJECTED");
    expect(body.subscription.predsLimit).toBe(1);
  });

  it("returns 400 for invalid status", async () => {
    const response = await PATCH(createPatchRequest({ userId: "user-1", status: "BOGUS" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when no pending PRO request exists", async () => {
    dbMock.select.mockReturnValueOnce(mockChain(null));
    const response = await PATCH(createPatchRequest({ userId: "user-1", status: "ACTIVE" }));
    expect(response.status).toBe(400);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await PATCH(createPatchRequest({ userId: "user-1", status: "ACTIVE" }));
    expect(response.status).toBe(403);
  });
});
