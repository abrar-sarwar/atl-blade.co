import { test, expect } from "@playwright/test";

/**
 * Cart e2e. Requires local Supabase with seed data (npm run db:reset).
 */
test.describe("cart", () => {
  test("adding a product updates the cart drawer and badge", async ({
    page,
  }) => {
    await page.goto("/products/karambit-knife");
    await page.getByRole("button", { name: /add to cart/i }).click();

    // Drawer opens with the line item.
    await expect(page.locator(".cart-drawer.open")).toBeVisible();
    await expect(
      page.locator(".cart-item-name", { hasText: /karambit/i }),
    ).toBeVisible();

    // Nav badge reflects the count.
    await expect(page.locator(".cart-badge")).toHaveText("1");

    // Subtotal is shown and a checkout button exists.
    await expect(
      page.getByRole("button", { name: /^checkout$/i }),
    ).toBeVisible();
  });

  test("quantity can be increased in the drawer", async ({ page }) => {
    await page.goto("/products/karambit-knife");
    await page.getByRole("button", { name: /add to cart/i }).click();
    await expect(page.locator(".cart-drawer.open")).toBeVisible();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.locator(".cart-badge")).toHaveText("2");
  });
});

test.describe("orders admin is protected", () => {
  test("anonymous user cannot reach orders", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
