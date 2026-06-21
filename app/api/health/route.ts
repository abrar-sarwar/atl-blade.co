import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/http";
import { getDashboardStats } from "@/lib/db/dashboard";

/**
 * Example protected API endpoint. Demonstrates the admin-API guard pattern that
 * every admin endpoint in later phases will reuse. Returns store counts.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const stats = await getDashboardStats();
  return NextResponse.json({
    ok: true,
    totalProducts: stats.totalProducts,
    totalOrders: stats.totalOrders,
    revenue: stats.revenue,
  });
}
