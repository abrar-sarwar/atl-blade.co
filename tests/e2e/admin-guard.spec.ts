import { test, expect } from "@playwright/test";

/**
 * Route-protection e2e. An unauthenticated visitor must never see admin UI;
 * they are redirected to the sign-in page. The authenticated admin happy-path
 * requires Google OAuth credentials and is documented as a manual check in
 * docs/SETUP.md.
 */
test.describe("admin route protection", () => {
  test("anonymous user is redirected from /admin to sign-in", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  });

  test("anonymous user is redirected from a nested admin route", async ({
    page,
  }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/auth\/signin\?redirectedFrom=%2Fadmin%2Fproducts/);
  });

  test("protected API returns 401 for anonymous requests", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
  });

  test("home page is publicly reachable", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /go to admin dashboard/i }),
    ).toBeVisible();
  });
});
