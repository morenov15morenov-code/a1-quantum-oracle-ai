import { test, expect } from "@playwright/test";

test.describe("Prediction flow", () => {
  test("prediction form shows character count", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    await expect(page.getByText("New Prediction")).toBeVisible();
    await expect(page.getByText("0/2000")).toBeVisible();
  });

  test("prediction form validates min length", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@atlas-oracle.com");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    const textarea = page.getByPlaceholder(/what would you like to predict/i);
    await textarea.fill("Short");
    await page.getByRole("button", { name: /generate prediction/i }).click();
    await expect(page.getByText("Question must be at least 10 characters")).toBeVisible();
  });
});
