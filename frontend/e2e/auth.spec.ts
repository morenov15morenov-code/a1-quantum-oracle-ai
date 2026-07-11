import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Sign In")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("Create an Account")).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
  });

  test("shows error for invalid login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("invalid@test.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible({ timeout: 10000 });
  });

  test("navigates to signup from login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Sign up").click();
    await expect(page).toHaveURL("/signup");
  });

  test("navigates to login from signup page", async ({ page }) => {
    await page.goto("/signup");
    await page.getByText("Sign in").click();
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
    await page.getByLabel("Password").fill("123");
    await page.getByLabel("Confirm Password").fill("123");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible();
  });
});
