# ATL Blade Co. — Phase 6 (Analytics & Dashboard Polish) Design

**Date:** 2026-06-21
**Branch:** `feat/admin-dashboard` (final phase; continues Phases 1–5)
**Depends on:** orders / order_items / products (Phases 1–4).

## Goal

Give the owner at-a-glance business insight: revenue, orders over time, top
sellers, and inventory performance — plus a few polish touches on the Dashboard.
Read-only reporting; **no schema changes**.

## Scope

**Analytics** (`/admin/analytics`)
- KPI cards: total revenue (paid), paid orders, units sold, average order value.
- Orders & revenue by day: bar chart over the last 14 days.
- Top-selling products: ranked by units sold (with revenue), top 8.
- Inventory performance: total units in stock, retail value (Σ inventory×price),
  out-of-stock and low-stock counts, and a low-stock watchlist.

**Dashboard polish** (`/admin`)
- Add "Units sold" and "Avg order value" stats; a compact 7-day revenue trend;
  a link to the full Analytics page.

## Architecture

```
lib/analytics/aggregate.ts   PURE, unit-tested:
                               buildOrdersByDay(orders, days, todayISO)
                               buildTopSellers(items, limit)
                               buildInventoryStats(products, lowStockThreshold)
                               summarizeKpis(orders, items)
lib/db/analytics.ts          getAnalytics(): fetches paid orders, paid order
                             items (inner-joined), and products; returns the
                             shaped report via the pure helpers.
components/admin/bar-chart.tsx  dependency-free CSS bar chart
components/admin/ranked-list.tsx ranked rows with inline bars
app/admin/analytics/page.tsx   the report
app/admin/page.tsx             (extend) dashboard polish
```

No charting dependency — small, deterministic CSS/flupercent bars keep the
build robust and SSR-safe. All aggregation is pure and testable; the data layer
only fetches rows and delegates.

## Data sources

- Paid revenue / orders / by-day: `orders` where `payment_status = 'paid'`.
- Units sold / top sellers: `order_items` inner-joined to paid `orders`.
- Inventory: active `products` (`inventory`, `price`).

`getAnalytics` passes a server-computed `todayISO` into the pure day-bucketing
helper so tests are deterministic (no `Date.now()` inside pure code).

## Testing

- Vitest: `buildOrdersByDay` (fills gap days, buckets correctly),
  `buildTopSellers` (aggregation + ordering + limit), `buildInventoryStats`
  (value, out/low counts), `summarizeKpis` (AOV, units).
- Playwright: `/admin/analytics` redirects anonymous users.

## Decisions

- "Revenue" everywhere means paid orders only (consistent with the Dashboard).
- Day bucketing uses UTC dates from `created_at`; the 14-day window always shows
  every day, including zero-revenue days, so the chart has no gaps.
- This completes the 6-phase roadmap; the static `legacy/` site remains in the
  repo for reference only.
