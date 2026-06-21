import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { finalizePaidOrder, setOrderCustomerDetails } from "@/lib/db/orders";

// Stripe needs the raw body for signature verification.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id ?? session.client_reference_id;

    if (orderId) {
      const details = session.customer_details;
      const shipping = session.collected_information?.shipping_details;
      await setOrderCustomerDetails(orderId, {
        name: shipping?.name ?? details?.name ?? null,
        email: details?.email ?? null,
        phone: details?.phone ?? null,
        shippingAddress: (shipping?.address ??
          details?.address ??
          null) as Record<string, unknown> | null,
      });

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null);

      await finalizePaidOrder(orderId, paymentIntentId, session.id);
    }
  }

  return NextResponse.json({ received: true });
}
