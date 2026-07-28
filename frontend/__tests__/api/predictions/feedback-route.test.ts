import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/predictions/feedback/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

function createDbMock() {
  const selectGet = vi.fn();

  const insertReturningGet = vi.fn();
  const insertRun = vi.fn().mockResolvedValue(undefined);

  const updateReturningGet = vi.fn();

  const selectFrom = vi.fn().mockReturnValue({
    get: selectGet,
    where: vi.fn().mockReturnValue({ get: selectGet }),
  });

  const insertValues = vi.fn().mockReturnValue({
    returning: vi.fn().mockReturnValue({ get: insertReturningGet }),
    run: insertRun,
  });

  const updateSet = vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      returning: vi.fn().mockReturnValue({ get: updateReturningGet }),
    }),
  });

  const db = {
    select: vi.fn().mockReturnValue({ from: selectFrom }),
    insert: vi.fn().mockReturnValue({ values: insertValues }),
    update: vi.fn().mockReturnValue({ set: updateSet }),
  };

  return { db, selectGet, insertReturningGet, insertRun, updateReturningGet, selectFrom, insertValues };
}

let mockDb: ReturnType<typeof createDbMock>;

vi.mock("@/lib/db", () => ({
  get db() {
    return mockDb.db;
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 19 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({ "X-RateLimit-Limit": "20", "X-RateLimit-Remaining": "19" }),
}));

const mockAuth = vi.mocked((await import("@/lib/auth")).auth);

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/predictions/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Feedback API - POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockDb = createDbMock();
  });

  it("creates feedback for valid prediction", async () => {
    mockDb.selectGet
      .mockResolvedValueOnce({ id: "pred-1", userId: "user-1" })
      .mockResolvedValueOnce(null);
    mockDb.insertReturningGet.mockResolvedValue({
      id: "fb-1", predictionId: "pred-1", userId: "user-1", rating: 4, wasAccurate: true, domain: "Finance",
    });

    const response = await POST(
      createRequest({ predictionId: "pred-1", rating: 4, wasAccurate: true, domain: "Finance" })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.rating).toBe(4);
  });

  it("rejects unauthorized", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(
      createRequest({ predictionId: "pred-1", rating: 3 })
    );
    expect(response.status).toBe(401);
  });

  it("rejects invalid input", async () => {
    const response = await POST(
      createRequest({ predictionId: "", rating: 0 })
    );
    expect(response.status).toBe(400);
  });

  it("rejects feedback for other users prediction", async () => {
    mockDb.selectGet.mockResolvedValue({ id: "pred-1", userId: "other-user" });

    const response = await POST(
      createRequest({ predictionId: "pred-1", rating: 3 })
    );
    expect(response.status).toBe(404);
  });

  it("updates existing feedback", async () => {
    mockDb.selectGet
      .mockResolvedValueOnce({ id: "pred-1", userId: "user-1" })
      .mockResolvedValueOnce({ id: "fb-1", predictionId: "pred-1", userId: "user-1", rating: 2 });
    mockDb.updateReturningGet.mockResolvedValue({
      id: "fb-1", predictionId: "pred-1", userId: "user-1", rating: 5, wasAccurate: true,
    });

    const response = await POST(
      createRequest({ predictionId: "pred-1", rating: 5, wasAccurate: true })
    );

    expect(response.status).toBe(200);
    expect(mockDb.db.update).toHaveBeenCalled();
  });

  it("logs analytics event", async () => {
    mockDb.selectGet
      .mockResolvedValueOnce({ id: "pred-1", userId: "user-1" })
      .mockResolvedValueOnce(null);
    mockDb.insertReturningGet.mockResolvedValue({
      id: "fb-1", predictionId: "pred-1", userId: "user-1", rating: 4,
    });

    await POST(
      createRequest({ predictionId: "pred-1", rating: 4, domain: "Health" })
    );

    expect(mockDb.insertRun).toHaveBeenCalled();
  });
});
