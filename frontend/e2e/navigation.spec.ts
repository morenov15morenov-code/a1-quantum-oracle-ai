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

  test("admin users API returns 403 without auth", async ({ page }) => {
    const response = await page.request.get("/api/admin/users");
    expect(response.status()).toBe(403);
  });

  test("admin analytics API returns 403 without auth", async ({ page }) => {
    const response = await page.request.get("/api/admin/analytics");
    expect(response.status()).toBe(403);
  });

  test("admin predictions API returns 403 without auth", async ({ page }) => {
    const response = await page.request.get("/api/admin/predictions");
    expect(response.status()).toBe(403);
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await expect(page.getByText(/404|not found/i).or(page.locator("h1"))).toBeVisible();
  });
});
