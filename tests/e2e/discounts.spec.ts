import { test, expect } from "@playwright/test";

/**
 * Discounts: admin protection + customer promo-code flow.
 * Requires local Supabase with seed data (npm run db:reset).
 */
test.describe("discounts admin is protected", () => {
  test("anonymous user cannot reach discounts", async ({ page }) => {
    await page.goto("/admin/discounts");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

test.describe("cart promo code", () => {
  test("a valid code applies; an invalid one is rejected", async ({ page }) => {
    await page.goto("/products/karambit-knife");
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.locator(".cart-drawer.open")).toBeVisible();

    // Invalid code → error.
    await page.getByPlaceholder("Promo code").fill("NOPE");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.locator(".cart-error")).toBeVisible();

    // Valid seeded code → applied state with a discount row.
    await page.getByPlaceholder("Promo code").fill("WELCOME10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.locator(".cart-promo-applied")).toContainText("WELCOME10");
    await expect(page.locator(".cart-row", { hasText: /Discount/i })).toBeVisible();
  });
});
