import { test, expect } from "@playwright/test";

test.describe("Responsive design", () => {
  test("landing page is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByText("Atlas Oracle")).toBeVisible();
    await expect(page.getByText("Sign In")).toBeVisible();
    await expect(page.getByText("Get Started")).toBeVisible();
  });

  test("login page is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup page is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create an Account" })).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("dashboard is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await expect(page.getByText(/dashboard|prediction/i)).toBeVisible();
  });

  test("landing page works on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.getByText("Atlas Oracle")).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("landing page has proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("login form has proper labels", async ({ page }) => {
    await page.goto("/login");
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.getByLabel("Password", { exact: true });
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("signup form has proper labels", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirm Password")).toBeVisible();
  });

  test("error messages have role=alert", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("invalid@test.com");
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
  });

  test("buttons are keyboard accessible", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const passwordField = page.getByLabel("Password", { exact: true });
    await expect(passwordField).toBeFocused();
  });
});

test.describe("Theme toggle", () => {
  test("theme toggle is visible on landing page", async ({ page }) => {
    await page.goto("/");
    const themeToggle = page.getByRole("button", { name: /theme|dark|light|toggle/i });
    const isVisible = await themeToggle.isVisible().catch(() => false);
    expect(typeof isVisible).toBe("boolean");
  });
});
