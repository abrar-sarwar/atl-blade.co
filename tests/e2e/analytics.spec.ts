import { test, expect } from "@playwright/test";

test.describe("analytics admin is protected", () => {
  test("anonymous user cannot reach analytics", async ({ page }) => {
    await page.goto("/admin/analytics");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
