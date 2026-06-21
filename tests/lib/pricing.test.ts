import { describe, it, expect } from "vitest";
import {
  effectivePrice,
  cartSubtotal,
  shippingFor,
  discountAmount,
  computeTotals,
  toCents,
  FLAT_SHIPPING,
} from "@/lib/commerce/pricing";

describe("effectivePrice", () => {
  it("prefers sale price when present", () => {
    expect(effectivePrice(100, 80)).toBe(80);
    expect(effectivePrice(100, null)).toBe(100);
    expect(effectivePrice(null, null)).toBeNull();
  });
});

describe("cartSubtotal", () => {
  it("sums unit price * quantity", () => {
    expect(
      cartSubtotal([
        { unitPrice: 129, quantity: 2 },
        { unitPrice: 59, quantity: 1 },
      ]),
    ).toBe(317);
  });
});

describe("shippingFor", () => {
  it("is free at/over the threshold, flat below, zero for empty", () => {
    expect(shippingFor(0)).toBe(0);
    expect(shippingFor(50)).toBe(FLAT_SHIPPING);
    expect(shippingFor(149.99)).toBe(FLAT_SHIPPING);
    expect(shippingFor(150)).toBe(0);
    expect(shippingFor(500)).toBe(0);
  });
});

describe("discountAmount", () => {
  it("applies percentage and fixed, capped at subtotal, never negative", () => {
    expect(
      discountAmount(200, { type: "percentage", value: 10, min_subtotal: null }),
    ).toBe(20);
    expect(
      discountAmount(50, { type: "fixed", value: 5, min_subtotal: null }),
    ).toBe(5);
    expect(
      discountAmount(3, { type: "fixed", value: 5, min_subtotal: null }),
    ).toBe(3); // capped at subtotal
  });

  it("returns 0 when min subtotal not met or no discount", () => {
    expect(
      discountAmount(40, { type: "fixed", value: 5, min_subtotal: 50 }),
    ).toBe(0);
    expect(discountAmount(100, null)).toBe(0);
  });
});

describe("computeTotals", () => {
  it("subtotal -> discount -> shipping on discounted base", () => {
    const totals = computeTotals(
      [{ unitPrice: 100, quantity: 1 }],
      { type: "percentage", value: 10, min_subtotal: null },
    );
    // 100 - 10 = 90 (< 150 → flat shipping 8) → total 98
    expect(totals).toEqual({
      subtotal: 100,
      discountTotal: 10,
      shippingTotal: 8,
      taxTotal: 0,
      total: 98,
    });
  });

  it("free shipping kicks in above threshold", () => {
    const totals = computeTotals([{ unitPrice: 200, quantity: 1 }], null);
    expect(totals.shippingTotal).toBe(0);
    expect(totals.total).toBe(200);
  });
});

describe("toCents", () => {
  it("converts dollars to integer cents", () => {
    expect(toCents(98)).toBe(9800);
    expect(toCents(12.5)).toBe(1250);
    expect(toCents(0.1)).toBe(10);
  });
});
