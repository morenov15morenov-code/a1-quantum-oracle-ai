import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/resend-verification/route";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 3 }),
}));
vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
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
  return new Request("http://localhost:3000/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Resend verification API route", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects invalid email", async () => {
    const response = await POST(createRequest({ email: "not-an-email" }));
    expect(response.status).toBe(400);
  });

  it("returns generic message for unknown email", async () => {
    dbMock.select.mockReturnValueOnce(selectChain(null));
    const response = await POST(createRequest({ email: "nobody@test.com" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toContain("If an account exists");
  });

  it("returns generic message for verified users", async () => {
    dbMock.select.mockReturnValueOnce(selectChain({ id: "user-1", emailVerified: new Date() }));
    const response = await POST(createRequest({ email: "verified@test.com" }));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toContain("If an account exists");
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it("regenerates token and emails unverified users", async () => {
    dbMock.select.mockReturnValueOnce(selectChain({ id: "user-1", email: "unverified@test.com", emailVerified: null }));
    dbMock.update.mockReturnValueOnce(updateChain());
    const response = await POST(createRequest({ email: "unverified@test.com" }));
    expect(response.status).toBe(200);
    expect(dbMock.update).toHaveBeenCalledTimes(1);
    const { sendVerificationEmail } = await import("@/lib/email");
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
