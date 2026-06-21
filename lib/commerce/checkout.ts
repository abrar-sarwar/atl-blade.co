import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeTotals,
  effectivePrice,
  type OrderTotals,
  type DiscountLike,
} from "./pricing";

export type CheckoutLineInput = { productId: string; quantity: number };

export type PricedItem = {
  productId: string;
  name: string;
  slug: string;
  unitPrice: number;
  quantity: number;
  image: string | null;
};

export type PricedCheckout = {
  items: PricedItem[];
  totals: OrderTotals;
  discountId: string | null;
};

export class CheckoutError extends Error {}

/**
 * Authoritative server-side pricing. Re-fetches every product from the DB,
 * validates quantities against live inventory, applies an optional discount
 * code, and computes totals. Never trusts client-supplied prices.
 */
export async function priceCheckout(
  lines: CheckoutLineInput[],
  discountCode?: string | null,
): Promise<PricedCheckout> {
  const clean = lines.filter((l) => l.quantity > 0);
  if (clean.length === 0) throw new CheckoutError("Your cart is empty.");

  const supabase = createAdminClient();
  const ids = clean.map((l) => l.productId);

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, slug, price, sale_price, inventory, active, product_images(url, is_primary, sort_order)",
    )
    .in("id", ids);
  if (error) throw error;

  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  const items: PricedItem[] = clean.map((line) => {
    const p = byId.get(line.productId);
    if (!p || !p.active) {
      throw new CheckoutError("A product in your cart is no longer available.");
    }
    const unit = effectivePrice(
      p.price != null ? Number(p.price) : null,
      p.sale_price != null ? Number(p.sale_price) : null,
    );
    if (unit == null) {
      throw new CheckoutError(`${p.name} is not available for purchase yet.`);
    }
    if (line.quantity > p.inventory) {
      throw new CheckoutError(
        `Only ${p.inventory} of ${p.name} ${p.inventory === 1 ? "is" : "are"} in stock.`,
      );
    }
    const imgs = (p.product_images ?? []) as {
      url: string;
      is_primary: boolean;
      sort_order: number;
    }[];
    const image =
      imgs.find((i) => i.is_primary)?.url ??
      [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
      null;

    return {
      productId: p.id,
      name: p.name,
      slug: p.slug,
      unitPrice: unit,
      quantity: line.quantity,
      image,
    };
  });

  // Optional discount.
  let discountId: string | null = null;
  let discount: DiscountLike | null = null;
  if (discountCode && discountCode.trim()) {
    const code = discountCode.trim().toUpperCase();
    const { data: d } = await supabase
      .from("discounts")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (!d || !d.active) throw new CheckoutError("That discount code is invalid.");
    const now = Date.now();
    if (d.starts_at && new Date(d.starts_at).getTime() > now) {
      throw new CheckoutError("That discount code is not active yet.");
    }
    if (d.expires_at && new Date(d.expires_at).getTime() < now) {
      throw new CheckoutError("That discount code has expired.");
    }
    if (d.usage_limit != null && d.usage_count >= d.usage_limit) {
      throw new CheckoutError("That discount code has reached its usage limit.");
    }
    discountId = d.id;
    discount = {
      type: d.type,
      value: Number(d.value),
      min_subtotal: d.min_subtotal != null ? Number(d.min_subtotal) : null,
    };
  }

  const totals = computeTotals(
    items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    discount,
  );

  // Minimum-subtotal discounts that don't apply are silently ignored above
  // (discountAmount returns 0); only attach the discount id when it bit.
  if (discount && totals.discountTotal === 0) {
    discountId = null;
  }

  return { items, totals, discountId };
}
