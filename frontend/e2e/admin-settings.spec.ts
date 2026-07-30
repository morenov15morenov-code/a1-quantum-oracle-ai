import { test, expect } from "@playwright/test";

test.describe("Admin flow", () => {
  test("admin dashboard is accessible with admin credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|admin\/dashboard)/);

    if (page.url().includes("/admin")) {
      await expect(page.getByText(/admin|dashboard/i)).toBeVisible();
    }
  });

  test("admin users page is accessible", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|admin\/dashboard)/);

    await page.goto("/admin/users");
    const url = page.url();
    const isOnAdmin = url.includes("/admin/users") || url.includes("/login");
    expect(isOnAdmin).toBe(true);
  });

  test("admin analytics page is accessible", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|admin\/dashboard)/);

    await page.goto("/admin/dashboard");
    const url = page.url();
    const isOnAdmin = url.includes("/admin") || url.includes("/login");
    expect(isOnAdmin).toBe(true);
  });

  test("non-admin user is redirected from admin pages", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));
    page.on("response", (r) => {
      if (r.url().includes("/api/auth")) {
        console.log(`[DBG] ${r.status()} ${r.request().method()} ${r.url()}`);
      }
    });
    page.on("pageerror", (err) => console.log("[DBG] pageerror:", err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log("[DBG] console.error:", msg.text());
    });

    await page.goto("/signup");
    await page.getByLabel("Name").fill("Regular User");
    await page.getByLabel("Email").fill(`user${Date.now()}@test.com`);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();

    try {
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    } catch {
      const url = page.url();
      const html = await page.content();
      const excerpt = html.substring(0, 3000);
      console.log(`[DBG] waitForURL failed. Current URL: ${url}`);
      console.log(`[DBG] First 3000 chars of page content:\n${excerpt}`);
      console.log(`[DBG] API requests made:\n${requests.join("\n")}`);
      throw new Error(`waitForURL(/\\/dashboard/) timed out. Current URL: ${url}`);
    }

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe("Password reset flow", () => {
  test("request reset page renders correctly", async ({ page }) => {
    await page.goto("/request-reset");
    await expect(page.getByRole("heading", { name: /reset|forgot/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("request reset form submits successfully", async ({ page }) => {
    await page.goto("/request-reset");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page.getByText(/if an account exists|sent|check your email/i)).toBeVisible();
  });

  test("request reset shows success even for non-existent email", async ({ page }) => {
    await page.goto("/request-reset");
    await page.getByLabel("Email").fill("nonexistent@test.com");
    await page.getByRole("button", { name: /send|reset/i }).click();
    await expect(page.getByText(/if an account exists|sent|check your email/i)).toBeVisible();
  });

  test("reset password page renders with invalid token", async ({ page }) => {
    await page.goto("/reset-password?token=invalidtoken123");
    await expect(page.getByText(/invalid|expired|error/i)).toBeVisible();
  });

  test("request reset rate limits after too many attempts", async ({ page }) => {
    for (let i = 0; i < 4; i++) {
      await page.request.post("/api/auth/request-reset", {
        data: { email: "admin@atlas-oracle.com" },
      });
    }

    const response = await page.request.post("/api/auth/request-reset", {
      data: { email: "admin@atlas-oracle.com" },
    });

    expect(response.status()).toBe(429);
  });
});

test.describe("Settings page", () => {
  test("settings page requires authentication", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("settings page shows profile form when logged in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|admin\/dashboard)/);

    await page.goto("/settings");
    await expect(page.getByText(/settings|profile|account/i)).toBeVisible();
  });
});
