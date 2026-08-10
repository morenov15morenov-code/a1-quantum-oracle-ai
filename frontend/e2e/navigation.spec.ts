import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("health endpoint returns ok", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("predictions API returns 401 without auth", async ({ page }) => {
    const response = await page.request.post("/api/predictions", {
      data: { input: "Test prediction question?" },
    });
    expect(response.status()).toBe(401);
  });

  test("admin users API returns 401 without auth", async ({ page }) => {
    const response = await page.request.get("/api/admin/users");
    expect(response.status()).toBe(401);
  });

  test("admin analytics API returns 401 without auth", async ({ page }) => {
    const response = await page.request.get("/api/admin/analytics");
    expect(response.status()).toBe(401);
  });

  test("admin predictions API returns 401 without auth", async ({ page }) => {
    const response = await page.request.get("/api/admin/predictions");
    expect(response.status()).toBe(401);
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@a1quantumoracleai.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.goto("/nonexistent-page");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("CORS and security headers are set", async ({ page }) => {
    const response = await page.request.get("/");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("health endpoint has correct structure", async ({ page }) => {
    const response = await page.request.get("/api/health");
    const body = await response.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("version");
  });
});
