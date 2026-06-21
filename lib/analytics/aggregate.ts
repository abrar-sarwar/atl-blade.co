/**
 * Pure analytics aggregation — no I/O, no Date.now(). All "today" references are
 * passed in so the functions are deterministic and unit-testable.
 */

export type PaidOrderRow = { total: number | string; created_at: string };
export type PaidItemRow = {
  product_id: string | null;
  product_name: string;
  quantity: number;
  line_total: number | string;
};
export type ProductRow = {
  id: string;
  name: string;
  inventory: number;
  price: number | string | null;
};

export type DayBucket = { date: string; orders: number; revenue: number };
export type TopSeller = {
  productId: string | null;
  name: string;
  units: number;
  revenue: number;
};
export type InventoryStats = {
  totalUnits: number;
  retailValue: number;
  outOfStock: number;
  lowStock: number;
  watchlist: { id: string; name: string; inventory: number }[];
};
export type Kpis = {
  revenue: number;
  orders: number;
  unitsSold: number;
  avgOrderValue: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** YYYY-MM-DD in UTC for a timestamp. */
function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function shiftDay(todayISO: string, deltaDays: number): string {
  const d = new Date(`${todayISO}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Buckets paid orders into the last `days` calendar days ending at `todayISO`
 * (inclusive). Always returns exactly `days` entries, oldest first, with zeros
 * for empty days.
 */
export function buildOrdersByDay(
  orders: PaidOrderRow[],
  days: number,
  todayISO: string,
): DayBucket[] {
  const buckets = new Map<string, DayBucket>();
  for (let i = days - 1; i >= 0; i--) {
    const date = shiftDay(todayISO, -i);
    buckets.set(date, { date, orders: 0, revenue: 0 });
  }
  for (const o of orders) {
    const key = dayKey(o.created_at);
    const b = buckets.get(key);
    if (b) {
      b.orders += 1;
      b.revenue = round2(b.revenue + Number(o.total));
    }
  }
  return [...buckets.values()];
}

/** Aggregates paid order items by product, ranked by units sold. */
export function buildTopSellers(
  items: PaidItemRow[],
  limit = 8,
): TopSeller[] {
  const map = new Map<string, TopSeller>();
  for (const it of items) {
    const key = it.product_id ?? it.product_name;
    const cur =
      map.get(key) ??
      { productId: it.product_id, name: it.product_name, units: 0, revenue: 0 };
    cur.units += it.quantity;
    cur.revenue = round2(cur.revenue + Number(it.line_total));
    cur.name = it.product_name || cur.name;
    map.set(key, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, limit);
}

export function buildInventoryStats(
  products: ProductRow[],
  lowStockThreshold: number,
): InventoryStats {
  let totalUnits = 0;
  let retailValue = 0;
  let outOfStock = 0;
  let lowStock = 0;
  const watch: { id: string; name: string; inventory: number }[] = [];

  for (const p of products) {
    totalUnits += p.inventory;
    retailValue = round2(retailValue + p.inventory * Number(p.price ?? 0));
    if (p.inventory === 0) outOfStock += 1;
    else if (p.inventory < lowStockThreshold) lowStock += 1;
    if (p.inventory < lowStockThreshold) {
      watch.push({ id: p.id, name: p.name, inventory: p.inventory });
    }
  }

  watch.sort((a, b) => a.inventory - b.inventory);
  return { totalUnits, retailValue, outOfStock, lowStock, watchlist: watch };
}

export function summarizeKpis(
  orders: PaidOrderRow[],
  items: PaidItemRow[],
): Kpis {
  const revenue = round2(
    orders.reduce((s, o) => s + Number(o.total), 0),
  );
  const orderCount = orders.length;
  const unitsSold = items.reduce((s, i) => s + i.quantity, 0);
  const avgOrderValue = orderCount === 0 ? 0 : round2(revenue / orderCount);
  return { revenue, orders: orderCount, unitsSold, avgOrderValue };
}
