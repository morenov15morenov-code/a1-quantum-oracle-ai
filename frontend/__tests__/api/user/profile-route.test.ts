import { describe, it, expect, vi, beforeEach } from "vitest";

function mockChain(result: unknown) {
  const terminal = {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
  const whereChain = {
    ...terminal,
    returning: vi.fn().mockReturnValue(terminal),
    orderBy: vi.fn().mockReturnValue({
      ...terminal,
      limit: vi.fn().mockReturnValue({ ...terminal, offset: vi.fn().mockReturnValue(terminal) }),
    }),
    groupBy: vi.fn().mockReturnValue({
      ...terminal,
      orderBy: vi.fn().mockReturnValue(terminal),
    }),
  };
  return {
    from: vi.fn().mockReturnValue({
      ...terminal,
      where: vi.fn().mockReturnValue(whereChain),
      orderBy: vi.fn().mockReturnValue({
        ...terminal,
        limit: vi.fn().mockReturnValue({ ...terminal, offset: vi.fn().mockReturnValue(terminal) }),
      }),
    }),
    values: vi.fn().mockReturnValue({
      ...terminal,
      returning: vi.fn().mockReturnValue(terminal),
    }),
    set: vi.fn().mockReturnValue({
      ...terminal,
      where: vi.fn().mockReturnValue({
        ...terminal,
        returning: vi.fn().mockReturnValue(terminal),
      }),
    }),
  };
}

const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
};

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", name: "Test User", email: "test@test.com", role: "USER" },
  }),
}));

const mockRateLimit = vi.fn().mockReturnValue({ success: true, remaining: 9 });

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: unknown[]) => mockRateLimit(...args),
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  },
}));

function createRequest(method: string, body: Record<string, unknown>, headers?: Record<string, string>) {
  return new Request("http://localhost:3000/api/user/profile", {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("Profile API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockReturnValue({ success: true, remaining: 9 });
  });

  describe("PATCH (update profile)", () => {
    it("updates profile with valid input", async () => {
      mockDb.select.mockReturnValueOnce(mockChain(null));
      mockDb.update.mockReturnValueOnce(mockChain({
        id: "user-1",
        name: "Updated Name",
        email: "updated@test.com",
        role: "USER",
        createdAt: new Date(),
      }));

      const { PATCH } = await import("@/app/api/user/profile/route");
      const response = await PATCH(createRequest("PATCH", { name: "Updated Name", email: "updated@test.com" }));
      expect(response.status).toBe(200);
    });

    it("returns 401 when not authenticated", async () => {
      const auth = await import("@/lib/auth");
      vi.mocked(auth.auth).mockResolvedValueOnce(null);

      const { PATCH } = await import("@/app/api/user/profile/route");
      const response = await PATCH(createRequest("PATCH", { name: "Test", email: "test@test.com" }));
      expect(response.status).toBe(401);
    });

    it("returns 409 when email is already in use", async () => {
      mockDb.select.mockReturnValueOnce(mockChain({ id: "other-user", email: "taken@test.com" }));

      const { PATCH } = await import("@/app/api/user/profile/route");
      const response = await PATCH(createRequest("PATCH", { name: "Test", email: "taken@test.com" }));
      expect(response.status).toBe(409);
    });

    it("returns 400 for invalid input", async () => {
      const { PATCH } = await import("@/app/api/user/profile/route");
      const response = await PATCH(createRequest("PATCH", { name: "", email: "not-an-email" }));
      expect(response.status).toBe(400);
    });

    it("returns 429 when rate limited", async () => {
      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      const { PATCH } = await import("@/app/api/user/profile/route");
      const response = await PATCH(createRequest("PATCH", { name: "Test", email: "test@test.com" }));
      expect(response.status).toBe(429);
    });
  });

  describe("PUT (change password)", () => {
    it("changes password with valid input", async () => {
      mockDb.select.mockReturnValueOnce(mockChain({ id: "user-1", password: "$2a$12$oldhash" }));
      mockDb.update.mockReturnValueOnce(mockChain(undefined));

      const { PUT } = await import("@/app/api/user/profile/route");
      const response = await PUT(createRequest("PUT", {
        currentPassword: "oldpass123",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      }));
      expect(response.status).toBe(200);
    });

    it("returns 400 when current password is incorrect", async () => {
      mockDb.select.mockReturnValueOnce(mockChain({ id: "user-1", password: "$2a$12$oldhash" }));
      const bcrypt = await import("bcryptjs");
      vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false);

      const { PUT } = await import("@/app/api/user/profile/route");
      const response = await PUT(createRequest("PUT", {
        currentPassword: "wrongpass",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      }));
      expect(response.status).toBe(400);
    });

    it("returns 400 for mismatched passwords", async () => {
      const { PUT } = await import("@/app/api/user/profile/route");
      const response = await PUT(createRequest("PUT", {
        currentPassword: "oldpass123",
        newPassword: "newpass123",
        confirmPassword: "different",
      }));
      expect(response.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      const auth = await import("@/lib/auth");
      vi.mocked(auth.auth).mockResolvedValueOnce(null);

      const { PUT } = await import("@/app/api/user/profile/route");
      const response = await PUT(createRequest("PUT", {
        currentPassword: "oldpass123",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      }));
      expect(response.status).toBe(401);
    });

    it("returns 429 when rate limited", async () => {
      mockRateLimit.mockReturnValue({ success: false, remaining: 0 });

      const { PUT } = await import("@/app/api/user/profile/route");
      const response = await PUT(createRequest("PUT", {
        currentPassword: "oldpass123",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      }));
      expect(response.status).toBe(429);
    });
  });
});
