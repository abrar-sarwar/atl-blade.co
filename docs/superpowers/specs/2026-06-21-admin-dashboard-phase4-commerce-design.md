# ATL Blade Co. — Phase 4 (Commerce) Design

**Date:** 2026-06-21
**Branch:** `feat/admin-dashboard` (continues Phases 1–3)
**Depends on:** Phases 1–3 (schema, storefront, products).

## Goal

Let customers buy online: a cart, Stripe Checkout, webhook-driven order creation,
and an Orders admin module to manage fulfillment.

## Scope

**Cart (storefront)**
- Client-side cart (localStorage) — guest checkout, no DB cart table.
- Add to cart from product detail and shop cards (only when a price is set).
- Cart drawer + `/cart` page: line items, quantity adjust, remove, subtotal.
- Cart count badge in the store nav.

**Checkout**
- `POST /api/checkout`: re-prices every line **from the DB** (never trusts the
  client), checks inventory, optionally validates a discount code, computes
  subtotal/discount/shipping/total, creates a **pending order + order_items**
  (service-role, bypasses RLS), then creates a Stripe Checkout Session and
  returns its URL. Client redirects to Stripe.
- Shipping: flat $8, free over $150. Tax: $0 (out of scope).
- `/checkout/success` and `/checkout/cancel` pages.

**Webhook + finalize**
- `POST /api/webhooks/stripe`: verifies the signature, and on
  `checkout.session.completed` calls `mark_order_paid(order_id, …)` — an
  **idempotent** SQL function that sets `payment_status=paid`, decrements
  product inventory, and increments discount usage exactly once.
- The finalize step is a pure-ish data function exercised directly in tests so
  the critical path is verified without Stripe.

**Orders admin** (`/admin/orders`)
- List: order number, customer, item count, total, payment + fulfillment badges,
  date; filter by fulfillment status; search by number/email.
- Detail (`/admin/orders/[id]`): customer info, shipping address, line items,
  totals, Stripe ids; update **fulfillment status**
  (pending→processing→shipped→delivered→cancelled) and payment status
  (manual override for non-Stripe/manual orders).

## Data / migration (`0006_commerce.sql`)

- `order_number_seq` sequence (starts at 1005, after the seed) +
  `next_order_number()` → `'ATL-' || lpad(nextval, 4, '0')`; set as the default
  for `orders.order_number`.
- `mark_order_paid(p_order_id, p_payment_intent, p_session)` security-definer:
  early-returns if already paid (idempotent); else sets paid + stripe ids,
  decrements inventory (`greatest(0, inventory - qty)`), bumps discount
  `usage_count`.
- No new tables — `orders`/`order_items`/`discounts` already exist (Phase 1).

## Architecture

```
lib/commerce/pricing.ts     pure: effectivePrice, cartSubtotal, shippingFor,
                            applyDiscount, computeTotals  (unit-tested)
lib/commerce/cart-storage.ts client cart persistence helpers
lib/stripe.ts               server Stripe client (lazy; throws if unconfigured)
lib/db/orders.ts            (extend) listOrders, getOrder, createPendingOrder,
                            finalizePaidOrder, updateFulfillment, updatePayment
components/store/cart-*      CartProvider, CartButton, AddToCart, CartDrawer
app/(store)/cart/page.tsx   cart page
app/(store)/checkout/{success,cancel}/page.tsx
app/api/checkout/route.ts   create order + Stripe session
app/api/webhooks/stripe/route.ts  verify + finalize
app/admin/orders/           list + [id] detail + actions
```

Order creation and the webhook use the **service-role client** (trusted server
ops). The discount code is validated server-side at checkout (active, within
window, under usage limit, meets min subtotal).

## Env

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (optional; hosted Checkout only needs the
secret server-side). When unset, the checkout endpoint returns a clear,
user-visible error and the rest of the app still runs.

## Testing

- Vitest: pricing (effective price, subtotal, free-shipping threshold, percentage
  vs fixed discount, totals).
- Integration: `createPendingOrder` + `mark_order_paid` against local Supabase —
  asserts order/items rows, idempotent inventory decrement, discount bump.
- Playwright: add-to-cart updates the cart badge and `/cart`; `/admin/orders`
  redirects anonymous users.

## Risks / decisions

- Stripe keys are the owner's; the build is complete and gated on env. The
  order-finalize path is verified directly against the DB so the
  inventory/discount/order logic is proven without live Stripe.
- Idempotency: re-delivered webhooks are safe (`mark_order_paid` no-ops if the
  order is already paid). Inventory never goes negative.
- Client cart prices are display-only; the server always re-prices from the DB,
  so tampering can't change what's charged.
