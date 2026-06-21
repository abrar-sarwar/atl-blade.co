import { describe, it, expect } from "vitest";
import { productInputSchema } from "@/lib/validation/product";
import { categoryInputSchema } from "@/lib/validation/category";
import { discountInputSchema } from "@/lib/validation/discount";

describe("productInputSchema", () => {
  const base = { name: "Karambit Knife", slug: "karambit-knife" };

  it("accepts a minimal valid product and applies defaults", () => {
    const parsed = productInputSchema.parse(base);
    expect(parsed.inventory).toBe(0);
    expect(parsed.active).toBe(true);
    expect(parsed.featured).toBe(false);
    expect(parsed.tags).toEqual([]);
  });

  it("rejects an invalid slug", () => {
    const result = productInputSchema.safeParse({ ...base, slug: "Not A Slug" });
    expect(result.success).toBe(false);
  });

  it("rejects a sale price above the price", () => {
    const result = productInputSchema.safeParse({
      ...base,
      price: 100,
      sale_price: 150,
    });
    expect(result.success).toBe(false);
  });

  it("coerces numeric strings for price and inventory", () => {
    const parsed = productInputSchema.parse({
      ...base,
      price: "120.50",
      inventory: "7",
    });
    expect(parsed.price).toBe(120.5);
    expect(parsed.inventory).toBe(7);
  });
});

describe("categoryInputSchema", () => {
  it("requires a name and valid slug", () => {
    expect(
      categoryInputSchema.safeParse({ name: "", slug: "x" }).success,
    ).toBe(false);
    expect(
      categoryInputSchema.safeParse({ name: "Damascus", slug: "damascus" })
        .success,
    ).toBe(true);
  });
});

describe("discountInputSchema", () => {
  it("rejects a percentage over 100", () => {
    const result = discountInputSchema.safeParse({
      code: "HALF",
      type: "percentage",
      value: 150,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid fixed discount", () => {
    const result = discountInputSchema.safeParse({
      code: "SAVE5",
      type: "fixed",
      value: 5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects expiry before start", () => {
    const result = discountInputSchema.safeParse({
      code: "WINDOW",
      type: "fixed",
      value: 5,
      starts_at: "2026-06-01T00:00:00.000Z",
      expires_at: "2026-05-01T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
