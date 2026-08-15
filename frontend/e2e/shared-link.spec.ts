import { test, expect } from "@playwright/test";

test.describe("Shared prediction links", () => {
  test("shared page is public and renders not-found for unknown slug", async ({ page }) => {
    await page.goto("/shared/does-not-exist");
    await expect(page.getByText("Prediction not found")).toBeVisible();
    await expect(page).not.toHaveURL(/\/login/);
  });
});
