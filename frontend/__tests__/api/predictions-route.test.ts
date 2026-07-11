import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/predictions/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    prediction: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    analyticsEvent: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai", () => ({
  generatePrediction: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 9 }),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockPrisma = vi.mocked(await import("@/lib/db")).prisma;
const mockAi = vi.mocked(await import("@/lib/ai")).generatePrediction;

function createAuthRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/predictions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createGetRequest(url: string) {
  return new Request(url, { method: "GET" });
}

describe("Predictions API - POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("creates prediction with valid input", async () => {
    mockAi.mockResolvedValue({
      result: "The forecast looks promising.",
      confidence: 0.85,
      reasoning: "Based on current trends.",
    });
    mockPrisma.prediction.create.mockResolvedValue({
      id: "pred-1",
      userId: "user-1",
      input: "What will happen next quarter?",
      result: "The forecast looks promising.",
      confidence: 0.85,
      reasoning: "Based on current trends.",
      model: "mock",
    });

    const response = await POST(
      createAuthRequest({ input: "What will happen next quarter?" })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("pred-1");
    expect(body.result).toBe("The forecast looks promising.");
  });

  it("rejects unauthorized requests", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(
      createAuthRequest({ input: "What will happen?" })
    );
    expect(response.status).toBe(401);
  });

  it("rejects short input", async () => {
    const response = await POST(
      createAuthRequest({ input: "Short" })
    );
    expect(response.status).toBe(400);
  });

  it("handles AI errors gracefully", async () => {
    mockAi.mockRejectedValue(new Error("AI error"));
    const response = await POST(
      createAuthRequest({ input: "What will happen next quarter?" })
    );
    expect(response.status).toBe(500);
  });

  it("logs prediction created event", async () => {
    mockAi.mockResolvedValue({
      result: "Forecast result",
      confidence: 0.7,
      reasoning: "Reasoning",
    });
    mockPrisma.prediction.create.mockResolvedValue({ id: "pred-1" });

    await POST(
      createAuthRequest({ input: "What will happen next quarter?" })
    );

    expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
      data: {
        event: "prediction_created",
        userId: "user-1",
        metadata: JSON.stringify({ predictionId: "pred-1" }),
      },
    });
  });
});

describe("Predictions API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns paginated predictions", async () => {
    mockPrisma.prediction.findMany.mockResolvedValue([
      { id: "pred-1", input: "Test input", result: "Test result", confidence: 0.8, reasoning: "Test", model: "mock", createdAt: new Date() },
    ]);
    mockPrisma.prediction.count.mockResolvedValue(1);

    const response = await GET(createGetRequest("http://localhost:3000/api/predictions?page=1&limit=20"));
    const body = await response.json();

    expect(body.predictions).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(1);
  });

  it("rejects unauthorized requests", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(createGetRequest("http://localhost:3000/api/predictions"));
    expect(response.status).toBe(401);
  });

  it("uses default pagination values", async () => {
    mockPrisma.prediction.findMany.mockResolvedValue([]);
    mockPrisma.prediction.count.mockResolvedValue(0);

    await GET(createGetRequest("http://localhost:3000/api/predictions"));

    const findManyCall = mockPrisma.prediction.findMany.mock.calls[0][0];
    expect(findManyCall.skip).toBe(0);
    expect(findManyCall.take).toBe(20);
  });

  it("handles custom pagination", async () => {
    mockPrisma.prediction.findMany.mockResolvedValue([]);
    mockPrisma.prediction.count.mockResolvedValue(50);

    const response = await GET(
      createGetRequest("http://localhost:3000/api/predictions?page=2&limit=10")
    );
    const body = await response.json();

    expect(body.page).toBe(2);
    expect(body.totalPages).toBe(5);

    const findManyCall = mockPrisma.prediction.findMany.mock.calls[0][0];
    expect(findManyCall.skip).toBe(10);
    expect(findManyCall.take).toBe(10);
  });

  it("orders by most recent first", async () => {
    mockPrisma.prediction.findMany.mockResolvedValue([]);
    mockPrisma.prediction.count.mockResolvedValue(0);

    await GET(createGetRequest("http://localhost:3000/api/predictions"));

    const findManyCall = mockPrisma.prediction.findMany.mock.calls[0][0];
    expect(findManyCall.orderBy.createdAt).toBe("desc");
  });

  it("filters by user id", async () => {
    mockAuth.mockResolvedValue({ user: { id: "specific-user" } });
    mockPrisma.prediction.findMany.mockResolvedValue([]);
    mockPrisma.prediction.count.mockResolvedValue(0);

    await GET(createGetRequest("http://localhost:3000/api/predictions"));

    const findManyCall = mockPrisma.prediction.findMany.mock.calls[0][0];
    expect(findManyCall.where.userId).toBe("specific-user");
  });
});
