import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/user/delete/route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 2 }),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
  },
  compare: vi.fn().mockResolvedValue(true),
}));

const mockCompare = vi.mocked((await import("bcryptjs")).default as unknown as { compare: ReturnType<typeof vi.fn> }).compare;

function mockChain(result: unknown) {
  const terminal = {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
  return {
    from: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal }) }),
    values: vi.fn().mockReturnValue({ ...terminal }),
    set: vi.fn().mockReturnValue({ ...terminal, where: vi.fn().mockReturnValue({ ...terminal }) }),
  };
}

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/user/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Delete Account API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    dbMock.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({ run: vi.fn().mockResolvedValue(undefined) }),
    });
  });

  it("deletes account with valid password", async () => {
    dbMock.select.mockReturnValueOnce(mockChain({
      id: "user-1", password: "$2b$12$hash", email: "user@test.com",
    }));
    const response = await POST(createRequest({ password: "correct-password" }));
    expect(response.status).toBe(200);
    expect(dbMock.delete).toHaveBeenCalledTimes(2);
  });

  it("rejects incorrect password", async () => {
    mockCompare.mockResolvedValue(false);
    dbMock.select.mockReturnValueOnce(mockChain({
      id: "user-1", password: "$2b$12$hash", email: "user@test.com",
    }));
    const response = await POST(createRequest({ password: "wrong" }));
    expect(response.status).toBe(403);
    expect(dbMock.delete).not.toHaveBeenCalled();
  });

  it("rejects missing password", async () => {
    const response = await POST(createRequest({}));
    expect(response.status).toBe(400);
  });

  it("rejects unauthorized", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(createRequest({ password: "whatever" }));
    expect(response.status).toBe(401);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked((await import("@/lib/rate-limit")).rateLimit).mockResolvedValueOnce({ success: false, remaining: 0 });
    const response = await POST(createRequest({ password: "whatever" }));
    expect(response.status).toBe(429);
  });
});
