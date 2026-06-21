import "server-only";
import { createClient } from "@/lib/supabase/server";
import { LOW_STOCK_THRESHOLD } from "@/lib/db/dashboard";
import {
  buildOrdersByDay,
  buildTopSellers,
  buildInventoryStats,
  summarizeKpis,
  type DayBucket,
  type TopSeller,
  type InventoryStats,
  type Kpis,
  type PaidItemRow,
} from "@/lib/analytics/aggregate";

export const ANALYTICS_WINDOW_DAYS = 14;

export type Analytics = {
  kpis: Kpis;
  ordersByDay: DayBucket[];
  topSellers: TopSeller[];
  inventory: InventoryStats;
};

/** Today's date (UTC) as YYYY-MM-DD — computed on the server, passed to pure code. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAnalytics(): Promise<Analytics> {
  const supabase = await createClient();

  const [paidOrders, paidItems, products] = await Promise.all([
    supabase
      .from("orders")
      .select("total, created_at")
      .eq("payment_status", "paid"),
    supabase
      .from("order_items")
      .select(
        "product_id, product_name, quantity, line_total, orders!inner(payment_status)",
      )
      .eq("orders.payment_status", "paid"),
    supabase
      .from("products")
      .select("id, name, inventory, price")
      .eq("active", true),
  ]);

  const orders = paidOrders.data ?? [];
  const items = (paidItems.data ?? []) as unknown as PaidItemRow[];
  const productRows = products.data ?? [];

  return {
    kpis: summarizeKpis(orders, items),
    ordersByDay: buildOrdersByDay(orders, ANALYTICS_WINDOW_DAYS, todayISO()),
    topSellers: buildTopSellers(items, 8),
    inventory: buildInventoryStats(productRows, LOW_STOCK_THRESHOLD),
  };
}
