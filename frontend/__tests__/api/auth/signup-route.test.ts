import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/signup/route";

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 5 }),
}));
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

function chain(result: unknown) {
  const terminal = {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
  return {
    from: vi.fn().mockReturnValue({
      ...terminal,
      where: vi.fn().mockReturnValue({
        ...terminal,
        returning: vi.fn().mockReturnValue(terminal),
      }),
    }),
    values: vi.fn().mockReturnValue({
      ...terminal,
      returning: vi.fn().mockReturnValue(terminal),
    }),
  };
}

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

const validBody = { name: "Test User", email: "test@test.com", password: "password123", confirmPassword: "password123" };

describe("Signup API route", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("creates user with valid input", async () => {
    dbMock.select.mockReturnValueOnce(chain(null));
    dbMock.insert.mockReturnValueOnce(chain({ id: "user-1", name: "Test User", email: "test@test.com" }));
    dbMock.insert.mockReturnValueOnce(chain(undefined));

    const response = await POST(createRequest(validBody));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("user-1");
    expect(body.name).toBe("Test User");
  });

  it("rejects duplicate email", async () => {
    dbMock.select.mockReturnValueOnce(chain({ id: "existing", email: "test@test.com" }));

    const response = await POST(createRequest(validBody));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toContain("already exists");
  });

  it("rejects invalid email", async () => {
    const response = await POST(createRequest({ name: "Test", email: "not-an-email", password: "password123" }));
    expect(response.status).toBe(400);
  });

  it("rejects short password", async () => {
    const response = await POST(createRequest({ name: "Test", email: "test@test.com", password: "123" }));
    expect(response.status).toBe(400);
  });

  it("rejects missing fields", async () => {
    const response = await POST(createRequest({ email: "test@test.com" }));
    expect(response.status).toBe(400);
  });

  it("handles database errors gracefully", async () => {
    dbMock.select.mockRejectedValueOnce(new Error("DB error"));
    const response = await POST(createRequest(validBody));
    expect(response.status).toBe(500);
  });

  it("creates analytics event on signup", async () => {
    dbMock.select.mockReturnValueOnce(chain(null));
    dbMock.insert.mockReturnValueOnce(chain({ id: "user-1", name: "Test User", email: "test@test.com" }));
    dbMock.insert.mockReturnValueOnce(chain(undefined));

    await POST(createRequest(validBody));
    expect(dbMock.insert).toHaveBeenCalledTimes(2);
  });

  it("hashes the password before storing", async () => {
    dbMock.select.mockReturnValueOnce(chain(null));
    dbMock.insert.mockReturnValueOnce(chain({ id: "user-1" }));
    dbMock.insert.mockReturnValueOnce(chain(undefined));

    const response = await POST(createRequest({ ...validBody, password: "securePassword123", confirmPassword: "securePassword123" }));
    expect(response.status).toBe(201);
    expect(dbMock.insert).toHaveBeenCalledTimes(2);
  });
});
