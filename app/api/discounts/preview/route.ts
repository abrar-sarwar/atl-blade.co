import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCheckout, CheckoutError } from "@/lib/commerce/checkout";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  code: z.string().min(1),
});

/**
 * Previews a discount code against the current cart using the same
 * authoritative pricing as checkout. Never consumes usage.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const priced = await priceCheckout(parsed.data.items, parsed.data.code);
    if (!priced.discountId || priced.totals.discountTotal <= 0) {
      return NextResponse.json(
        { applied: false, error: "This code doesn't apply to your current cart." },
        { status: 200 },
      );
    }
    return NextResponse.json({
      applied: true,
      discountTotal: priced.totals.discountTotal,
      shippingTotal: priced.totals.shippingTotal,
      total: priced.totals.total,
    });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json(
        { applied: false, error: err.message },
        { status: 200 },
      );
    }
    throw err;
  }
}
