import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/user/subscription/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

const mockAuth = vi.mocked((await import("@/lib/auth")).auth);
const mockDb = vi.mocked((await import("@/lib/db")).db);

function mockChain(result: unknown) {
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
    set: vi.fn().mockReturnValue({
      ...terminal,
      where: vi.fn().mockReturnValue({
        ...terminal,
        returning: vi.fn().mockReturnValue(terminal),
      }),
    }),
  };
}

function createPostRequest(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/user/subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Subscription API - GET", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns existing subscription", async () => {
    mockDb.select.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "FREE", predsUsed: 3, predsLimit: 5, periodStart: new Date(), periodEnd: null,
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tier).toBe("FREE");
    expect(body.predsUsed).toBe(3);
  });

  it("creates subscription if none exists", async () => {
    mockDb.select.mockReturnValue(mockChain(null));
    mockDb.insert.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "FREE", predsUsed: 0, predsLimit: 5, periodStart: new Date(), periodEnd: null,
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tier).toBe("FREE");
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it("rejects unauthorized", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("resets usage when period expires", async () => {
    const pastDate = new Date(Date.now() - 86400000);
    mockDb.select.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "FREE", predsUsed: 5, predsLimit: 5, periodStart: pastDate, periodEnd: pastDate,
    }));
    mockDb.update.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "FREE", predsUsed: 0, predsLimit: 5, periodStart: new Date(), periodEnd: null,
    }));

    const response = await GET();
    const body = await response.json();

    expect(body.predsUsed).toBe(0);
  });
});

describe("Subscription API - POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("creates subscription with tier", async () => {
    mockDb.select.mockReturnValue(mockChain(null));
    mockDb.insert.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "PRO", predsUsed: 0, predsLimit: 100, periodStart: new Date(), periodEnd: null,
    }));

    const response = await POST(
      createPostRequest({ tier: "PRO" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tier).toBe("PRO");
    expect(body.predsLimit).toBe(100);
  });

  it("updates existing subscription", async () => {
    mockDb.select.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "FREE", predsUsed: 3, predsLimit: 5, periodStart: new Date(), periodEnd: null,
    }));
    mockDb.update.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "PRO", predsUsed: 0, predsLimit: 100, periodStart: new Date(), periodEnd: null,
    }));
    mockDb.insert.mockReturnValue(mockChain(null));

    const response = await POST(
      createPostRequest({ tier: "PRO" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tier).toBe("PRO");
  });

  it("rejects invalid tier", async () => {
    const response = await POST(
      createPostRequest({ tier: "INVALID" })
    );
    expect(response.status).toBe(400);
  });

  it("creates PRO subscription as PENDING when admin approval required", async () => {
    vi.stubEnv("ADMIN_APPROVAL_REQUIRED", "true");
    mockDb.select.mockReturnValue(mockChain(null));
    mockDb.insert.mockReturnValue(mockChain({
      id: "sub-1", userId: "user-1", tier: "PRO", status: "PENDING", predsUsed: 0, predsLimit: 1, periodStart: new Date(), periodEnd: null,
    }));

    const response = await POST(
      createPostRequest({ tier: "PRO" })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tier).toBe("PRO");
    expect(body.status).toBe("PENDING");
    expect(body.predsLimit).toBe(1);
    vi.unstubAllEnvs();
  });

  it("rejects unauthorized", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(
      createPostRequest({ tier: "PRO" })
    );
    expect(response.status).toBe(401);
  });
});
