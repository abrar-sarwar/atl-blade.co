/**
 * Pure pricing logic — no I/O, fully unit-tested. Used by the checkout route
 * (server-side, authoritative) and for display. All money in whole-dollar
 * numbers (USD); cents are derived only when talking to Stripe.
 */

export const FLAT_SHIPPING = 8;
export const FREE_SHIPPING_THRESHOLD = 150;

export type DiscountLike = {
  type: "percentage" | "fixed";
  value: number;
  min_subtotal: number | null;
};

export type PricedLine = {
  unitPrice: number;
  quantity: number;
};

/** The price a customer actually pays for one unit (sale price wins). */
export function effectivePrice(
  price: number | null,
  salePrice: number | null,
): number | null {
  if (salePrice != null) return salePrice;
  return price;
}

export function cartSubtotal(lines: PricedLine[]): number {
  return round2(
    lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );
}

/** Flat shipping, waived once the subtotal reaches the free threshold. */
export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

/**
 * Discount amount applied to a subtotal. Returns 0 when the discount's minimum
 * subtotal isn't met. Never discounts below 0.
 */
export function discountAmount(
  subtotal: number,
  discount: DiscountLike | null,
): number {
  if (!discount) return 0;
  if (discount.min_subtotal != null && subtotal < discount.min_subtotal) {
    return 0;
  }
  const raw =
    discount.type === "percentage"
      ? (subtotal * discount.value) / 100
      : discount.value;
  return round2(Math.min(Math.max(raw, 0), subtotal));
}

export type OrderTotals = {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
};

/** Full order totals: subtotal → discount → shipping (on the discounted base). */
export function computeTotals(
  lines: PricedLine[],
  discount: DiscountLike | null,
): OrderTotals {
  const subtotal = cartSubtotal(lines);
  const discountTotal = discountAmount(subtotal, discount);
  const discounted = round2(subtotal - discountTotal);
  const shippingTotal = shippingFor(discounted);
  const taxTotal = 0;
  const total = round2(discounted + shippingTotal + taxTotal);
  return { subtotal, discountTotal, shippingTotal, taxTotal, total };
}

/** Dollars → integer cents, for Stripe line items. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
