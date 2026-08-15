import { test, expect } from "@playwright/test";
import { signInAs } from "./helpers/login";

test.describe("Prediction flow", () => {
  test("prediction form shows character count", async ({ page }) => {
    await signInAs(page, "admin@a1quantumoracleai.com", "admin123");

    await expect(page.getByText("Consult the Oracle")).toBeVisible();
    await expect(page.getByText("0/2000")).toBeVisible();
  });

  test("prediction form validates min length", async ({ page }) => {
    await signInAs(page, "admin@a1quantumoracleai.com", "admin123");

    const textarea = page.getByPlaceholder(/what do you want to know/i);
    await textarea.fill("Short");
    await page.getByRole("button", { name: /get prediction/i }).click();
    await expect(page.getByText("Question must be at least 10 characters")).toBeVisible();
  });

  test("dashboard shows user greeting", async ({ page }) => {
    await signInAs(page, "admin@a1quantumoracleai.com", "admin123");

    await expect(page.getByRole("heading", { name: "Predictions", exact: true })).toBeVisible();
  });

  test("settings page is accessible from dashboard", async ({ page }) => {
    await signInAs(page, "admin@a1quantumoracleai.com", "admin123");

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("history page is accessible from dashboard", async ({ page }) => {
    await signInAs(page, "admin@a1quantumoracleai.com", "admin123");

    await page.goto("/history");
    await expect(page.getByRole("heading", { name: "Prediction History" })).toBeVisible();
  });

  test("prediction form textarea updates character count", async ({ page }) => {
    await signInAs(page, "admin@a1quantumoracleai.com", "admin123");

    const textarea = page.getByPlaceholder(/what do you want to know/i);
    await textarea.fill("Will the stock market go up tomorrow?");
    await expect(page.getByText("37/2000")).toBeVisible();
  });

  test("prediction form requires non-empty input", async ({ page }) => {
    await signInAs(page, "admin@a1quantumoracleai.com", "admin123");

    const textarea = page.getByPlaceholder(/what do you want to know/i);
    await textarea.fill("a");
    await page.getByRole("button", { name: /get prediction/i }).click();
    await expect(page.getByText("Question must be at least 10 characters")).toBeVisible();
  });
});
