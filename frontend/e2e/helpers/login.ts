import type { Page } from "@playwright/test";

export async function signInAs(page: Page, email: string, password: string) {
  const authEvents: string[] = [];
  const onResponse = (r: { url(): string; status(): number; request(): { method(): string } }) => {
    if (r.url().includes("/api/auth/")) {
      const path = r.url().replace(/^.*:3000/, "").split("?")[0];
      authEvents.push(`${r.request().method()} ${path} -> ${r.status()}`);
    }
  };
  page.on("response", onResponse);

  const submitAndWait = async (attempt: number): Promise<void> => {
    if (attempt > 1) {
      await page.getByRole("button", { name: /sign in/i }).click();
    }
    try {
      await page.waitForURL(/\/(dashboard|admin\/dashboard)/, { timeout: 30000 });
      return;
    } catch (err) {
      const alertText = await page.getByRole("alert").textContent().catch(() => "no-alert");
      if (alertText?.includes("Something went wrong") && attempt < 2) {
        return submitAndWait(attempt + 1);
      }
      const url = page.url();
      const btnText = await page.getByRole("button", { name: /sign in/i }).textContent().catch(() => "gone");
      throw new Error(
        `Login failed (attempt ${attempt}). url=${url} alert="${alertText}" signInBtn="${btnText}" ` +
          `authEvents=[${authEvents.join(" | ")}] ${err instanceof Error ? err.message : String(err)}`
      );
    }
  };

  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await submitAndWait(1);
  } finally {
    page.off("response", onResponse);
  }
}
