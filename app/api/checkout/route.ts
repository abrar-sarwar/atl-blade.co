import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCheckout, CheckoutError } from "@/lib/commerce/checkout";
import { createPendingOrder, attachCheckoutSession } from "@/lib/db/orders";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { toCents } from "@/lib/commerce/pricing";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  code: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });
  }

  let priced;
  try {
    priced = await priceCheckout(parsed.data.items, parsed.data.code);
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // Create the pending order up front so we have a record even if payment is
  // abandoned. Customer details are filled in by the webhook from Stripe.
  const order = await createPendingOrder({
    customer: { name: "Pending", email: "pending@checkout.local" },
    items: priced.items,
    totals: priced.totals,
    discountId: priced.discountId,
  });

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Online payment isn't configured yet. Please contact us to complete your order.",
      },
      { status: 503 },
    );
  }

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const stripe = getStripe();

  const lineItems = priced.items.map((i) => ({
    quantity: i.quantity,
    price_data: {
      currency: "usd",
      unit_amount: toCents(i.unitPrice),
      product_data: {
        name: i.name,
        images: i.image ? [`${origin}${i.image}`] : undefined,
      },
    },
  }));

  if (priced.totals.shippingTotal > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: toCents(priced.totals.shippingTotal),
        product_data: { name: "Shipping", images: undefined },
      },
    });
  }

  // Represent the discount as a one-off coupon so Stripe charges our total.
  let discounts: { coupon: string }[] | undefined;
  if (priced.totals.discountTotal > 0) {
    const coupon = await stripe.coupons.create({
      amount_off: toCents(priced.totals.discountTotal),
      currency: "usd",
      duration: "once",
      name: "Discount",
    });
    discounts = [{ coupon: coupon.id }];
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      discounts,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: true },
      success_url: `${origin}/checkout/success?order=${order.orderNumber}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    await attachCheckoutSession(order.id, session.id);
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
