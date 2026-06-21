import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus, FulfillmentStatus } from "@/lib/types/db";
import {
  buildOrdersByDay,
  type DayBucket,
  type PaidItemRow,
} from "@/lib/analytics/aggregate";

export const DASHBOARD_TREND_DAYS = 7;

export const LOW_STOCK_THRESHOLD = 5;

/** Sum of order totals for orders that have been paid. Pure + unit-tested. */
export function sumPaidRevenue(
  orders: { total: number | string | null; payment_status: string }[],
): number {
  return orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + Number(o.total ?? 0), 0);
}

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
};

export type LowStockProduct = {
  id: string;
  name: string;
  inventory: number;
};

export type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  unitsSold: number;
  avgOrderValue: number;
  revenueTrend: DayBucket[];
  recentOrders: RecentOrder[];
  lowStock: LowStockProduct[];
};

/**
 * Aggregates the figures shown on the admin dashboard. Runs as the admin user
 * (RLS-allowed) from a Server Component. All counts come from the database;
 * nothing is hardcoded.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    productCount,
    orderCount,
    paidOrders,
    paidItems,
    recent,
    lowStockRows,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("total, payment_status, created_at")
      .eq("payment_status", "paid"),
    supabase
      .from("order_items")
      .select("quantity, orders!inner(payment_status)")
      .eq("orders.payment_status", "paid"),
    supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, total, payment_status, fulfillment_status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("products")
      .select("id, name, inventory")
      .eq("active", true)
      .lt("inventory", LOW_STOCK_THRESHOLD)
      .order("inventory", { ascending: true }),
  ]);

  const paid = paidOrders.data ?? [];
  const revenue = sumPaidRevenue(paid);
  const unitsSold = ((paidItems.data ?? []) as unknown as PaidItemRow[]).reduce(
    (s, i) => s + i.quantity,
    0,
  );
  const avgOrderValue =
    paid.length === 0 ? 0 : Math.round((revenue / paid.length) * 100) / 100;
  const revenueTrend = buildOrdersByDay(
    paid.map((o) => ({ total: o.total ?? 0, created_at: o.created_at })),
    DASHBOARD_TREND_DAYS,
    new Date().toISOString().slice(0, 10),
  );

  const recentOrders: RecentOrder[] = (recent.data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name,
    total: Number(o.total ?? 0),
    paymentStatus: o.payment_status,
    fulfillmentStatus: o.fulfillment_status,
    createdAt: o.created_at,
  }));

  const lowStock: LowStockProduct[] = (lowStockRows.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    inventory: p.inventory,
  }));

  return {
    totalProducts: productCount.count ?? 0,
    totalOrders: orderCount.count ?? 0,
    revenue,
    unitsSold,
    avgOrderValue,
    revenueTrend,
    recentOrders,
    lowStock,
  };
}
