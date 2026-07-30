import { test, expect } from "@playwright/test";

test.describe("Prediction flow", () => {
  test("prediction form shows character count", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await expect(page.getByText("New Prediction")).toBeVisible();
    await expect(page.getByText("0/2000")).toBeVisible();
  });

  test("prediction form validates min length", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    const textarea = page.getByPlaceholder(/what would you like to predict/i);
    await textarea.fill("Short");
    await page.getByRole("button", { name: /generate prediction/i }).click();
    await expect(page.getByText("Question must be at least 10 characters")).toBeVisible();
  });

  test("dashboard shows user greeting", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await expect(page.getByRole("heading", { name: "Predictions" })).toBeVisible();
  });

  test("settings page is accessible from dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|admin\/dashboard)/);

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("history page is accessible from dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|admin\/dashboard)/);

    await page.goto("/history");
    await expect(page.getByText(/history|predictions/i)).toBeVisible();
  });

  test("prediction form textarea updates character count", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    const textarea = page.getByPlaceholder(/what would you like to predict/i);
    await textarea.fill("Will the stock market go up tomorrow?");
    await expect(page.getByText("37/2000")).toBeVisible();
  });

  test("prediction form requires non-empty input", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password", { exact: true }).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await page.getByRole("button", { name: /generate prediction/i }).click();
    await expect(page.getByText(/required|must be at least/i)).toBeVisible();
  });
});
