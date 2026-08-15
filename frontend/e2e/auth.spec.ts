import { test, expect } from "@playwright/test";

const hasOAuth = !!process.env.GOOGLE_CLIENT_ID || !!process.env.GITHUB_CLIENT_ID;

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create an Account" })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
  });

  test("shows error for invalid login", async ({ page }) => {
    const authEvents: string[] = [];
    const onResponse = (r: {
      url(): string;
      status(): number;
      request(): { method(): string };
      headers(): Record<string, string>;
    }) => {
      if (r.url().includes("/api/auth/")) {
        const path = r.url().replace(/^.*:3000/, "").split("?")[0];
        const limit = r.headers()["x-rate-limit-max"];
        authEvents.push(`${r.request().method()} ${path} -> ${r.status()}${limit ? ` (limit=${limit})` : ""}`);
      }
    };
    page.on("response", onResponse);
    await page.goto("/login");
    await page.getByLabel("Email").fill("invalid@test.com");
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword");

    const expected = page.getByText("Invalid email or password");
    await page.getByRole("button", { name: /sign in/i }).click();
    try {
      await expect(expected).toBeVisible({ timeout: 15000 });
    } catch (err) {
      const alertText = await page.getByRole("alert").textContent().catch(() => "no-alert");
      if (alertText?.includes("Something went wrong")) {
        await page.getByRole("button", { name: /sign in/i }).click();
        await expect(expected).toBeVisible({ timeout: 15000 });
      } else {
        throw new Error(
          `Invalid-login message not shown. url=${page.url()} alert="${alertText}" ` +
            `authEvents=[${authEvents.join(" | ")}] ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } finally {
      page.off("response", onResponse);
    }
  });

  test("navigates to signup from login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /sign up/i }).click();
    await expect(page).toHaveURL("/signup");
  });

  test("navigates to login from signup page", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/login");
  });

  test("redirects to login when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects to login when accessing admin route", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows validation error for short password on signup", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("test@test.com");
    await page.getByLabel("Password", { exact: true }).fill("123");
    await page.getByLabel("Confirm Password").fill("123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible();
  });

  test("shows OAuth buttons on login page", async ({ page }) => {
    test.skip(!hasOAuth, "OAuth providers not configured on CI");
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
  });

  test("shows OAuth buttons on signup page", async ({ page }) => {
    test.skip(!hasOAuth, "OAuth providers not configured on CI");
    await page.goto("/signup");
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with github/i })).toBeVisible();
  });

  test("shows forgot password link on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("navigates to forgot password from login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/request-reset/);
  });

  test("login form has email and password fields", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password", { exact: true });
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("signup form validates email format", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});
