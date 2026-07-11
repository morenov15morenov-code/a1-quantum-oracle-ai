import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/admin/predictions/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    prediction: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/lib/db")).prisma;

function createGetRequest(url: string) {
  return new Request(url, { method: "GET" });
}

describe("Admin Predictions API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all predictions for admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mockPrisma.prediction.findMany.mockResolvedValue([
      {
        id: "pred-1",
        userId: "user-1",
        input: "Test",
        result: "Result",
        confidence: 0.8,
        reasoning: null,
        model: "gpt-4o",
        tokensIn: null,
        tokensOut: null,
        createdAt: new Date(),
        user: { id: "user-1", name: "Alice", email: "alice@test.com" },
      },
    ]);
    mockPrisma.prediction.count.mockResolvedValue(1);

    const response = await GET(
      createGetRequest("http://localhost:3000/api/admin/predictions?page=1&limit=20")
    );
    const body = await response.json();
    expect(body.predictions).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.predictions[0].user.name).toBe("Alice");
  });

  it("returns 403 for non-admin", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1", role: "USER" } });
    const response = await GET(
      createGetRequest("http://localhost:3000/api/admin/predictions")
    );
    expect(response.status).toBe(403);
  });

  it("returns 403 for unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(
      createGetRequest("http://localhost:3000/api/admin/predictions")
    );
    expect(response.status).toBe(403);
  });

  it("includes user data with predictions", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mockPrisma.prediction.findMany.mockResolvedValue([]);
    mockPrisma.prediction.count.mockResolvedValue(0);

    await GET(
      createGetRequest("http://localhost:3000/api/admin/predictions")
    );

    const include = mockPrisma.prediction.findMany.mock.calls[0][0]?.include;
    expect(include.user.select.name).toBe(true);
    expect(include.user.select.email).toBe(true);
  });

  it("supports custom pagination", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mockPrisma.prediction.findMany.mockResolvedValue([]);
    mockPrisma.prediction.count.mockResolvedValue(50);

    const response = await GET(
      createGetRequest("http://localhost:3000/api/admin/predictions?page=3&limit=10")
    );
    const body = await response.json();
    expect(body.page).toBe(3);
    expect(body.totalPages).toBe(5);
  });

  it("orders by most recent", async () => {
    mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    mockPrisma.prediction.findMany.mockResolvedValue([]);
    mockPrisma.prediction.count.mockResolvedValue(0);

    await GET(
      createGetRequest("http://localhost:3000/api/admin/predictions")
    );

    expect(mockPrisma.prediction.findMany.mock.calls[0][0]?.orderBy.createdAt).toBe("desc");
  });
});
