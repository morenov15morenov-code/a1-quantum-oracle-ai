import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 5 }),
}));
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
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

function insertChain(result: unknown) {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue(result),
      }),
      run: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { name: "Test User", email: "test@test.com", password: "password123", confirmPassword: "password123" };

describe("Signup API route with email verification gated", () => {
  const original = process.env.EMAIL_VERIFICATION_REQUIRED;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.EMAIL_VERIFICATION_REQUIRED = "true";
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.EMAIL_VERIFICATION_REQUIRED;
    } else {
      process.env.EMAIL_VERIFICATION_REQUIRED = original;
    }
  });

  it("creates unverified user, stores hashed token, sends verification email", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");
    const { sendVerificationEmail, sendWelcomeEmail } = await import("@/lib/email");

    dbMock.select.mockReturnValueOnce(selectChain(null));
    dbMock.insert.mockReturnValueOnce(insertChain({ id: "user-1", name: "Test User", email: "test@test.com" }));
    dbMock.insert.mockReturnValueOnce(insertChain(undefined));

    const response = await POST(createRequest(validBody));
    expect(response.status).toBe(201);

    const insertValues = dbMock.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(insertValues.emailVerified).toBeNull();
    expect(insertValues.emailVerifyToken).toMatch(/^[a-f0-9]{64}$/);
    expect(insertValues.emailVerifyExpires).toBeInstanceOf(Date);

    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
    const [to, verifyUrl] = sendVerificationEmail.mock.calls[0];
    expect(to).toBe("test@test.com");
    expect(verifyUrl).toContain("/verify-email?token=");
    expect(verifyUrl).not.toContain(insertValues.emailVerifyToken);
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("verification token is hashed, not stored raw", async () => {
    const { POST } = await import("@/app/api/auth/signup/route");

    dbMock.select.mockReturnValueOnce(selectChain(null));
    dbMock.insert.mockReturnValueOnce(insertChain({ id: "user-1" }));
    dbMock.insert.mockReturnValueOnce(insertChain(undefined));

    const { sendVerificationEmail } = await import("@/lib/email");
    await POST(createRequest(validBody));

    const storedToken = dbMock.insert.mock.results[0].value.values.mock.calls[0][0].emailVerifyToken;
    const rawToken = sendVerificationEmail.mock.calls[0][1].split("token=")[1];
    expect(storedToken).not.toBe(rawToken);
  });
});
