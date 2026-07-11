import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/health/route";

describe("Health API", () => {
  it("returns ok status", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(response.status).toBe(200);
  });

  it("returns a timestamp", async () => {
    const response = await GET();
    const body = await response.json();
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe("string");
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });

  it("returns JSON content type", async () => {
    const response = await GET();
    const headers = Object.fromEntries(response.headers.entries());
    expect(headers["content-type"]).toContain("application/json");
  });
});
