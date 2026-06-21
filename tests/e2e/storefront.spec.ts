import { test, expect } from "@playwright/test";

/**
 * Storefront e2e. Verifies the DB-driven shop renders products and that a
 * product card navigates to a working detail page. Requires local Supabase
 * with seed data (npm run db:reset).
 */
test.describe("storefront", () => {
  test("shop lists products from the database", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator(".catalog-card")).not.toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: /karambit knife/i }),
    ).toBeVisible();
  });

  test("a product links through to its detail page", async ({ page }) => {
    await page.goto("/products/karambit-knife");
    await expect(
      page.locator(".detail-name", { hasText: /karambit/i }),
    ).toBeVisible();
    // Specs and features render from the database.
    await expect(page.getByText("Specifications")).toBeVisible();
  });

  test("tag filter narrows the grid", async ({ page }) => {
    await page.goto("/shop?filter=tactical");
    const names = await page.locator(".catalog-name").allInnerTexts();
    expect(names.join(" ")).toMatch(/karambit/i);
    expect(names.join(" ")).not.toMatch(/USA Flag/i);
  });
});

test.describe("admin catalog protection", () => {
  test("anonymous user cannot reach product editor", async ({ page }) => {
    await page.goto("/admin/products/new");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
