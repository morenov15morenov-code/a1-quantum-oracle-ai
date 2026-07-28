import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/health/route";

const mockAll = vi.fn().mockResolvedValue([{ "1": 1 }]);

vi.mock("@/lib/db", () => ({
  db: {
    all: (...args: unknown[]) => mockAll(...args),
  },
}));

describe("Health API", () => {
  it("returns ok status", async () => {
    mockAll.mockResolvedValue([{ "1": 1 }]);
    const response = await GET();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("ok");
    expect(response.status).toBe(200);
  });

  it("returns a timestamp", async () => {
    mockAll.mockResolvedValue([{ "1": 1 }]);
    const response = await GET();
    const body = await response.json();
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("returns JSON content type", async () => {
    mockAll.mockResolvedValue([{ "1": 1 }]);
    const response = await GET();
    const headers = Object.fromEntries(response.headers.entries());
    expect(headers["content-type"]).toContain("application/json");
  });

  it("returns degraded status when db fails", async () => {
    mockAll.mockRejectedValue(new Error("DB down"));
    const response = await GET();
    const body = await response.json();
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("error");
    expect(response.status).toBe(200);
  });
});
