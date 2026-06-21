import { test, expect } from "@playwright/test";

/**
 * Home + Contact + admin-editor protection. Requires local Supabase with seed
 * data (npm run db:reset).
 */
test.describe("home page (DB-driven)", () => {
  test("renders hero, featured products, and sections from the DB", async ({
    page,
  }) => {
    await page.goto("/");
    // Hero gold word from the seeded title "Handmade **Knives** From Atlanta".
    await expect(page.locator(".gold-word")).toHaveText(/knives/i);
    // Featured grid shows a seeded featured product.
    await expect(
      page.locator(".featured-card", { hasText: /karambit/i }),
    ).toBeVisible();
    // Seeded about + quote sections.
    await expect(page.locator(".craft-quote")).toBeVisible();
  });

  test("navigates home -> shop -> contact", async ({ page }) => {
    await page.goto("/");
    // waitForURL tolerates first-hit route compilation in dev mode.
    await page.getByRole("link", { name: "Shop", exact: true }).click();
    await page.waitForURL(/\/shop/);
    await page.getByRole("link", { name: "Contact", exact: true }).click();
    await page.waitForURL(/\/contact/);
    await expect(
      page.getByRole("button", { name: /send message/i }),
    ).toBeVisible();
  });
});

test.describe("contact page", () => {
  test("shows the seeded contact email and a working form", async ({ page }) => {
    await page.goto("/contact");
    await expect(
      page.getByRole("link", { name: /atlbladeco@gmail\.com/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /send message/i }),
    ).toBeVisible();
  });
});

test.describe("admin content editors are protected", () => {
  test("anonymous cannot reach homepage editor or settings", async ({
    page,
  }) => {
    await page.goto("/admin/homepage");
    await expect(page).toHaveURL(/\/auth\/signin/);
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});
