import { test, expect } from "@playwright/test";

test.describe("Rate limiting", () => {
  test("rate limit returns 429 after too many login attempts", async ({ page }) => {
    const opts = {
      form: { email: "test@test.com", password: "wrongpassword", csrfToken: "" },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };
    for (let i = 0; i < 25; i++) {
      const r = await page.request.post("/api/auth/callback/credentials", opts);
      if (r.status() === 429) break;
    }
    const response = await page.request.post("/api/auth/callback/credentials", opts);
    expect(response.status()).toBe(429);
  });

  test("signup API rate limits after too many attempts", async ({ page }) => {
    for (let i = 0; i < 7; i++) {
      const r = await page.request.post("/api/auth/signup", {
        data: {
          name: "Test User",
          email: `ratelimit${i}@test.com`,
          password: "password123",
        },
      });
      if (r.status() === 429) break;
    }

    const response = await page.request.post("/api/auth/signup", {
      data: {
        name: "Test User",
        email: "ratelimit-last@test.com",
        password: "password123",
      },
    });

    expect(response.status()).toBe(429);
  });
});
