import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/predictions/route";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/ai", () => ({ generatePrediction: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ success: true, remaining: 9 }),
  getRateLimitHeaders: vi.fn().mockReturnValue({}),
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;
const mockAi = vi.mocked(await import("@/lib/ai")).generatePrediction;

const { dbMock } = vi.hoisted(() => ({
  dbMock: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}));
vi.mock("@/lib/db", () => ({ db: dbMock }));

function terminal(result: unknown) {
  return {
    get: vi.fn().mockResolvedValue(result),
    all: vi.fn().mockResolvedValue(Array.isArray(result) ? result : result != null ? [result] : []),
    run: vi.fn().mockResolvedValue(undefined),
  };
}

function selectChain(result: unknown) {
  const t = terminal(result);
  const tReturning = { ...t, returning: vi.fn().mockReturnValue(t) };
  const tWhere = { ...t, returning: vi.fn().mockReturnValue(tReturning), orderBy: vi.fn().mockReturnValue({ ...t, limit: vi.fn().mockReturnValue({ ...t, offset: vi.fn().mockReturnValue(t) }) }) };
  const tFrom = { ...t, where: vi.fn().mockReturnValue(tWhere) };
  return { from: vi.fn().mockReturnValue(tFrom) };
}

function insertChain(result: unknown) {
  const t = terminal(result);
  return { values: vi.fn().mockReturnValue({ ...t, returning: vi.fn().mockReturnValue(t) }) };
}

function updateChain(result: unknown) {
  const t = terminal(result);
  return { set: vi.fn().mockReturnValue({ ...t, where: vi.fn().mockReturnValue({ ...t, returning: vi.fn().mockReturnValue(t) }) }) };
}

function createAuthRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/predictions", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

function createGetRequest(url: string) {
  return new Request(url, { method: "GET" });
}

const subData = { id: "sub-1", userId: "user-1", tier: "FREE", predsUsed: 0, predsLimit: 5, periodStart: new Date(), periodEnd: null };

describe("Predictions API - POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("creates prediction with valid input", async () => {
    mockAi.mockResolvedValue({ result: "The forecast looks promising.", confidence: 0.85, reasoning: "Based on current trends." });
    dbMock.select.mockReturnValue(selectChain({ ...subData, periodEnd: null }));
    dbMock.insert
      .mockReturnValueOnce(insertChain({ id: "pred-1", userId: "user-1", input: "What will happen next quarter?", result: "The forecast looks promising.", confidence: 0.85, reasoning: "Based on current trends.", model: "mock" }))
      .mockReturnValueOnce(insertChain(undefined));
    dbMock.update.mockReturnValueOnce(updateChain(undefined));

    const response = await POST(createAuthRequest({ input: "What will happen next quarter?" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBe("pred-1");
  });

  it("rejects unauthorized requests", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(createAuthRequest({ input: "What will happen?" }));
    expect(response.status).toBe(401);
  });

  it("rejects short input", async () => {
    dbMock.select.mockReturnValue(selectChain({ ...subData, periodEnd: null }));
    const response = await POST(createAuthRequest({ input: "Short" }));
    expect(response.status).toBe(400);
  });

  it("handles AI errors gracefully", async () => {
    mockAi.mockRejectedValue(new Error("AI error"));
    dbMock.select.mockReturnValue(selectChain({ ...subData, periodEnd: null }));
    const response = await POST(createAuthRequest({ input: "What will happen next quarter?" }));
    expect(response.status).toBe(500);
  });

  it("logs prediction created event", async () => {
    mockAi.mockResolvedValue({ result: "Forecast result", confidence: 0.7, reasoning: "Reasoning" });
    dbMock.select.mockReturnValue(selectChain({ ...subData, periodEnd: null }));
    const analyticsMock = insertChain(undefined);
    dbMock.insert
      .mockReturnValueOnce(insertChain({ id: "pred-1" }))
      .mockReturnValueOnce(analyticsMock);
    dbMock.update.mockReturnValueOnce(updateChain(undefined));

    await POST(createAuthRequest({ input: "What will happen next quarter?" }));
    expect(analyticsMock.values).toHaveBeenCalled();
  });

  it("rejects when free tier limit reached", async () => {
    dbMock.select.mockReturnValue(selectChain({ ...subData, tier: "FREE", predsUsed: 5, predsLimit: 5, periodEnd: null }));
    const response = await POST(createAuthRequest({ input: "What will happen next quarter?" }));
    expect(response.status).toBe(403);
  });

  it("allows pro users to create predictions", async () => {
    dbMock.select.mockReturnValue(selectChain({ ...subData, tier: "PRO", predsUsed: 95, predsLimit: 100, periodEnd: null }));
    mockAi.mockResolvedValue({ result: "Forecast result", confidence: 0.7, reasoning: "Reasoning" });
    dbMock.insert
      .mockReturnValueOnce(insertChain({ id: "pred-1" }))
      .mockReturnValueOnce(insertChain(undefined));
    dbMock.update.mockReturnValueOnce(updateChain(undefined));

    const response = await POST(createAuthRequest({ input: "What will happen next quarter?" }));
    expect(response.status).toBe(201);
  });
});

describe("Predictions API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns paginated predictions", async () => {
    dbMock.select
      .mockReturnValueOnce(selectChain([{ id: "pred-1", input: "Test", result: "Test", confidence: 0.8, reasoning: "Test", model: "mock", createdAt: new Date() }]))
      .mockReturnValueOnce(selectChain([{ count: 1 }]));

    const response = await GET(createGetRequest("http://localhost:3000/api/predictions?page=1&limit=20"));
    const body = await response.json();
    expect(body.predictions).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("rejects unauthorized requests", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(createGetRequest("http://localhost:3000/api/predictions"));
    expect(response.status).toBe(401);
  });

  it("uses default pagination values", async () => {
    dbMock.select
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([{ count: 0 }]));
    const response = await GET(createGetRequest("http://localhost:3000/api/predictions"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.totalPages).toBe(0);
  });

  it("handles custom pagination", async () => {
    dbMock.select
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([{ count: 50 }]));
    const response = await GET(createGetRequest("http://localhost:3000/api/predictions?page=2&limit=10"));
    const body = await response.json();
    expect(body.page).toBe(2);
    expect(body.totalPages).toBe(5);
  });

  it("orders by most recent first", async () => {
    dbMock.select
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([{ count: 0 }]));
    const response = await GET(createGetRequest("http://localhost:3000/api/predictions"));
    expect(response.status).toBe(200);
  });

  it("filters by user id", async () => {
    mockAuth.mockResolvedValue({ user: { id: "specific-user" } });
    dbMock.select
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([{ count: 0 }]));
    const response = await GET(createGetRequest("http://localhost:3000/api/predictions"));
    expect(response.status).toBe(200);
  });
});
