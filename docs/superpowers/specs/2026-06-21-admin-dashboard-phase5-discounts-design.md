# ATL Blade Co. — Phase 5 (Discounts) Design

**Date:** 2026-06-21
**Branch:** `feat/admin-dashboard` (continues Phases 1–4)
**Depends on:** Phase 1 (`discounts` table), Phase 4 (checkout discount validation).

## Goal

Manage discount codes from the admin, and let customers apply a code at
checkout. The `discounts` table, `discountInputSchema`, and server-side
checkout validation (`priceCheckout`) already exist — this phase adds the CRUD
UI and the cart promo-code field.

## Scope

**Admin — Discounts** (`/admin/discounts`)
- List: code, type (percentage/fixed), value, usage (`usage_count / limit`),
  active window (starts/expires), min subtotal, active badge.
- Create / edit dialog: code, type, value, optional start/expiry, usage limit,
  min subtotal, active. Validated with the existing `discountInputSchema`.
- Activate/deactivate toggle; delete (with confirm). Shows whether a code is
  currently live (active + within window + under usage limit).

**Cart promo code**
- A code input in the cart drawer. On apply, the cart previews the discount via
  `POST /api/discounts/preview` (validates the code against the current cart and
  returns the discount amount + new total, or an error). The applied code is
  passed to `/api/checkout` so the server re-validates and charges the
  discounted total (already implemented).

## Architecture

```
lib/db/discounts.ts          listDiscounts, getDiscount, create/update/delete,
                             setDiscountActive
lib/commerce/discounts.ts    isDiscountLive(d, now)  (pure, unit-tested)
app/admin/discounts/         page + _components/discount-manager + actions
app/api/discounts/preview/route.ts   server preview for the cart
components/store/cart/cart-drawer.tsx (extend) promo input + applied state
```

The preview endpoint reuses `priceCheckout` (which already validates the code
and computes totals), so the cart preview and the final charge use identical
authoritative logic.

## Testing

- Vitest: `isDiscountLive` (active flag, time window, usage-limit edges).
- Vitest: `discountInputSchema` percentage-cap + date-order (already covered;
  extend if gaps).
- Playwright: `/admin/discounts` redirects anonymous users; applying an invalid
  code in the cart shows an error.

## Decisions

- Datetime inputs (`datetime-local`) are converted to ISO before validation.
- `usage_count` is incremented only on paid orders (Phase 4 `mark_order_paid`),
  not at preview/checkout-start — previews never consume usage.
- A code that fails its minimum-subtotal is reported to the customer rather than
  silently ignored at preview time.
