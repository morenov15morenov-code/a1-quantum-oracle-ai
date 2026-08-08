import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("renders the landing page with title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Atlas Oracle")).toBeVisible();
  });

  test("shows sign in and consult the oracle buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Sign In")).toBeVisible();
    await expect(page.getByText("Consult the Oracle")).toBeVisible();
  });

  test("navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Sign In").click();
    await expect(page).toHaveURL("/login");
  });

  test("navigates to signup page", async ({ page }) => {
    await page.goto("/");
    await page.getByText("Consult the Oracle").click();
    await expect(page).toHaveURL("/signup");
  });

  test("shows app description", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText(/AI-powered predictions/)
    ).toBeVisible();
  });
});
