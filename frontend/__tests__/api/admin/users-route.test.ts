import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH } from "@/app/api/admin/users/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/lib/db")).prisma;

function createAdminAuth(user: Record<string, unknown> = {}) {
  mockAuth.mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN", ...user },
  });
}

function createNonAdminAuth() {
  mockAuth.mockResolvedValue({
    user: { id: "user-1", role: "USER" },
  });
}

function createNoAuth() {
  mockAuth.mockResolvedValue(null);
}

describe("Admin Users API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all users for admin", async () => {
    createAdminAuth();
    mockPrisma.user.findMany.mockResolvedValue([
      { id: "1", name: "Alice", email: "alice@test.com", role: "ADMIN", active: true, createdAt: new Date() },
    ]);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.users).toHaveLength(1);
    expect(body.users[0].name).toBe("Alice");
  });

  it("returns 403 for non-admin", async () => {
    createNonAdminAuth();
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("returns 401 for unauthenticated", async () => {
    createNoAuth();
    const response = await GET();
    expect(response.status).toBe(403);
  });

  it("orders users by newest first", async () => {
    createAdminAuth();
    mockPrisma.user.findMany.mockResolvedValue([]);
    await GET();
    expect(mockPrisma.user.findMany.mock.calls[0][0]?.orderBy.createdAt).toBe("desc");
  });

  it("selects only specific fields", async () => {
    createAdminAuth();
    mockPrisma.user.findMany.mockResolvedValue([]);
    await GET();
    const select = mockPrisma.user.findMany.mock.calls[0][0]?.select;
    expect(select).toBeDefined();
    expect(select.id).toBe(true);
    expect(select.name).toBe(true);
    expect(select.email).toBe(true);
    expect(select.role).toBe(true);
    expect(select.active).toBe(true);
    expect(select.createdAt).toBe(true);
    expect(select.password).toBeUndefined();
  });
});

describe("Admin Users API - PATCH", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createPatchRequest(body: Record<string, unknown>) {
    return new Request("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("updates user active status", async () => {
    createAdminAuth();
    mockPrisma.user.update.mockResolvedValue({
      id: "user-1",
      name: "Bob",
      email: "bob@test.com",
      role: "USER",
      active: false,
    });

    const response = await PATCH(
      createPatchRequest({ userId: "user-1", active: false })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.active).toBe(false);
  });

  it("returns 403 for non-admin", async () => {
    createNonAdminAuth();
    const response = await PATCH(
      createPatchRequest({ userId: "user-1", active: true })
    );
    expect(response.status).toBe(403);
  });

  it("returns 400 when userId missing", async () => {
    createAdminAuth();
    const response = await PATCH(
      createPatchRequest({ active: true })
    );
    expect(response.status).toBe(400);
  });

  it("handles invalid JSON body", async () => {
    createAdminAuth();
    const request = new Request("http://localhost:3000/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const response = await PATCH(request);
    expect(response.status).toBe(500);
  });
});
