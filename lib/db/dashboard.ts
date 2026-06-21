import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentStatus, FulfillmentStatus } from "@/lib/types/db";

export const LOW_STOCK_THRESHOLD = 5;

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
    recent,
    lowStockRows,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
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

  const revenue = (paidOrders.data ?? []).reduce(
    (sum, o) => sum + Number(o.total ?? 0),
    0,
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
    recentOrders,
    lowStock,
  };
}
