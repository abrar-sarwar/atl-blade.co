import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/** Lazily-constructed Stripe client. Throws a clear error if unconfigured. */
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  // Use the library's pinned API version (omit to avoid a brittle literal).
  cached = new Stripe(key);
  return cached;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
