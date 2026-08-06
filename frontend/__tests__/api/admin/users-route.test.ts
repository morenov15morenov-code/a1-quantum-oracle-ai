import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/admin/users/route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 29 }),
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
    from: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }) }),
    values: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }),
    set: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal, returning: vi.fn().mockReturnValue(terminal) }) }),
  };
}

function createGetRequest() {
  return new Request("http://localhost:3000/api/admin/users", { method: "GET" });
}

function createPatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/admin/users", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

describe("Admin Users API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  });

  it("returns all users for admin", async () => {
    dbMock.select.mockReturnValueOnce(mockChain([{ id: "1", name: "Alice", email: "alice@test.com", role: "ADMIN", active: true, createdAt: new Date() }]));
    const response = await GET(createGetRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.users).toHaveLength(1);
    expect(body.users[0].name).toBe("Alice");
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await GET(createGetRequest());
    expect(response.status).toBe(403);
  });

  it("returns 401 for unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(createGetRequest());
    expect(response.status).toBe(403);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked((await import("@/lib/rate-limit")).rateLimit).mockReturnValueOnce({ success: false, remaining: 0 });
    const response = await GET(createGetRequest());
    expect(response.status).toBe(429);
  });
});

describe("Admin Users API - PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
  });

  it("updates user active status", async () => {
    dbMock.select.mockReturnValueOnce(mockChain({ id: "user-1", name: "Bob", email: "bob@test.com", role: "USER", active: true }));
    dbMock.update.mockReturnValueOnce(mockChain({ id: "user-1", name: "Bob", email: "bob@test.com", role: "USER", active: false }));
    const response = await PATCH(createPatchRequest({ userId: "user-1", active: false }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.active).toBe(false);
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await PATCH(createPatchRequest({ userId: "user-1", active: true }));
    expect(response.status).toBe(403);
  });

  it("returns 400 when userId missing", async () => {
    const response = await PATCH(createPatchRequest({ active: true }));
    expect(response.status).toBe(400);
  });

  it("handles invalid JSON body", async () => {
    const request = new Request("http://localhost:3000/api/admin/users", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: "not-json",
    });
    const response = await PATCH(request);
    expect(response.status).toBe(500);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked((await import("@/lib/rate-limit")).rateLimit).mockReturnValueOnce({ success: false, remaining: 0 });
    const response = await PATCH(createPatchRequest({ userId: "user-1", active: false }));
    expect(response.status).toBe(429);
  });

  it("returns 400 when admin tries to deactivate their own account", async () => {
    const response = await PATCH(createPatchRequest({ userId: "admin-1", active: false }));
    expect(response.status).toBe(400);
  });

  it("returns 404 when target user does not exist", async () => {
    dbMock.select.mockReturnValueOnce(mockChain(null));
    const response = await PATCH(createPatchRequest({ userId: "missing", active: false }));
    expect(response.status).toBe(404);
  });

  it("blocks deactivating an admin via Protocol 7", async () => {
    dbMock.select.mockReturnValueOnce(mockChain({ id: "admin-2", name: "Carol", email: "carol@test.com", role: "ADMIN", active: true }));
    const response = await PATCH(createPatchRequest({ userId: "admin-2", active: false }));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.code).toBe("PROTOCOL7_BLOCKED");
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("allows deactivating a regular user via Protocol 7", async () => {
    dbMock.select.mockReturnValueOnce(mockChain({ id: "user-1", name: "Bob", email: "bob@test.com", role: "USER", active: true }));
    dbMock.update.mockReturnValueOnce(mockChain({ id: "user-1", name: "Bob", email: "bob@test.com", role: "USER", active: false }));
    const response = await PATCH(createPatchRequest({ userId: "user-1", active: false }));
    expect(response.status).toBe(200);
  });

  it("promotes a user to admin", async () => {
    dbMock.select.mockReturnValueOnce(mockChain({ id: "user-1", name: "Bob", email: "bob@test.com", role: "USER", active: true }));
    dbMock.update.mockReturnValueOnce(mockChain({ id: "user-1", name: "Bob", email: "bob@test.com", role: "ADMIN", active: true }));
    const response = await PATCH(createPatchRequest({ userId: "user-1", role: "ADMIN" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.role).toBe("ADMIN");
  });

  it("rejects invalid role value", async () => {
    const response = await PATCH(createPatchRequest({ userId: "user-1", role: "SUPERUSER" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when admin tries to demote their own account", async () => {
    const response = await PATCH(createPatchRequest({ userId: "admin-1", role: "USER" }));
    expect(response.status).toBe(400);
  });
});
