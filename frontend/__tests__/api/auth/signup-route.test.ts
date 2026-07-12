import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/signup/route";

const mockCreate = vi.fn();
const mockAnalyticsCreate = vi.fn();
const mockRateLimit = vi.fn().mockReturnValue({ success: true, remaining: 5 });

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    analyticsEvent: {
      create: (...args: unknown[]) => mockAnalyticsCreate(...args),
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Signup API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates user with valid input", async () => {
    mockCreate.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@test.com",
    });

    const response = await POST(
      createRequest({
        name: "Test User",
        email: "test@test.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("user-1");
    expect(body.name).toBe("Test User");
    expect(body.email).toBe("test@test.com");
    expect(body.password).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    const p2002Error = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
      meta: { target: ["email"] },
    });
    mockCreate.mockRejectedValue(p2002Error);

    const response = await POST(
      createRequest({
        name: "Test User",
        email: "existing@test.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toContain("already exists");
  });

  it("rejects invalid email", async () => {
    const response = await POST(
      createRequest({
        name: "Test User",
        email: "not-an-email",
        password: "password123",
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects short password", async () => {
    const response = await POST(
      createRequest({
        name: "Test User",
        email: "test@test.com",
        password: "123",
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects missing fields", async () => {
    const response = await POST(
      createRequest({ email: "test@test.com" })
    );

    expect(response.status).toBe(400);
  });

  it("handles database errors gracefully", async () => {
    mockCreate.mockRejectedValue(new Error("DB error"));

    const response = await POST(
      createRequest({
        name: "Test User",
        email: "test@test.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(response.status).toBe(500);
  });

  it("creates analytics event on signup", async () => {
    mockCreate.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@test.com",
    });

    await POST(
      createRequest({
        name: "Test User",
        email: "test@test.com",
        password: "password123",
        confirmPassword: "password123",
      })
    );

    expect(mockAnalyticsCreate).toHaveBeenCalledWith({
      data: { event: "user_signup", userId: "user-1" },
    });
  });

  it("hashes the password before storing", async () => {
    mockCreate.mockResolvedValue({ id: "user-1" });

    await POST(
      createRequest({
        name: "Test User",
        email: "test@test.com",
        password: "securePassword123",
        confirmPassword: "securePassword123",
      })
    );

    const createCall = mockCreate.mock.calls[0][0];
    expect(createCall.data.password).not.toBe("securePassword123");
    expect(createCall.data.password).toMatch(/^\$2[ab]\$/);
  });
});
