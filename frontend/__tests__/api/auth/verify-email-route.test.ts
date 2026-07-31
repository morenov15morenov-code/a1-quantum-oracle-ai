import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/verify-email/route";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 10 }),
}));

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), update: vi.fn(), insert: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

function selectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(result),
        all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
      }),
    }),
  };
}

function updateChain() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validToken = "a".repeat(64);

describe("Verify email API route", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects malformed tokens", async () => {
    const response = await POST(createRequest({ token: "short" }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid verification token");
  });

  it("rejects expired tokens", async () => {
    dbMock.select.mockReturnValueOnce(selectChain(null));
    const response = await POST(createRequest({ token: validToken }));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid or expired");
  });

  it("verifies a valid pending user", async () => {
    dbMock.select.mockReturnValueOnce(selectChain({ id: "user-1", emailVerified: null }));
    dbMock.update.mockReturnValueOnce(updateChain());
    const response = await POST(createRequest({ token: validToken }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toContain("verified");
    expect(dbMock.update).toHaveBeenCalledTimes(1);
  });

  it("returns success when already verified", async () => {
    dbMock.select.mockReturnValueOnce(selectChain({ id: "user-1", emailVerified: new Date() }));
    const response = await POST(createRequest({ token: validToken }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toContain("already verified");
    expect(dbMock.update).not.toHaveBeenCalled();
  });
});
