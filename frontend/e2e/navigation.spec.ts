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
    await page.goto("/nonexistent-page");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("rate limit returns 429 after too many login attempts", async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.request.post("/api/auth/callback/credentials", {
        form: {
          email: "test@test.com",
          password: "wrongpassword",
          csrfToken: "",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    }

    const response = await page.request.post("/api/auth/callback/credentials", {
      form: {
        email: "test@test.com",
        password: "wrongpassword",
        csrfToken: "",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expect(response.status()).toBe(429);
  });

  test("signup API rate limits after too many attempts", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.request.post("/api/auth/signup", {
        data: {
          name: "Test User",
          email: `test${i}@ratelimit.com`,
          password: "password123",
        },
      });
    }

    const response = await page.request.post("/api/auth/signup", {
      data: {
        name: "Test User",
        email: "testlast@ratelimit.com",
        password: "password123",
      },
    });

    expect(response.status()).toBe(429);
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
    expect(body).toHaveProperty("uptime");
  });
});
