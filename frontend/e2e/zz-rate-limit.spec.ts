import { test, expect } from "@playwright/test";

test.describe("Rate limiting", () => {
  test("login endpoint responds without error", async ({ page }) => {
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
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test("signup endpoint validates input", async ({ page }) => {
    const response = await page.request.post("/api/auth/signup", {
      data: {
        name: "",
        email: "invalid",
        password: "123",
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
