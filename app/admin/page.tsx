import Link from "next/link";
import {
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { getDashboardStats, LOW_STOCK_THRESHOLD } from "@/lib/db/dashboard";
import { StatCard } from "@/components/admin/stat-card";
import { PaymentBadge, FulfillmentBadge } from "@/components/admin/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Always reflect the latest data; the dashboard is admin-only and lightweight.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Day-to-day overview of your store.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <BarChart3 className="size-4" /> View full analytics
        </Link>
      </div>

      {/* Operational at-a-glance counts (Analytics has the deeper KPIs + trends). */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={String(stats.totalProducts)}
          icon={Package}
        />
        <StatCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Revenue (paid)"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
        />
        <StatCard
          label="Low Inventory"
          value={String(stats.lowStock.length)}
          icon={AlertTriangle}
          hint={`Below ${LOW_STOCK_THRESHOLD} units`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>The latest orders across your store.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Fulfillment</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="hover:text-primary"
                        >
                          {o.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell>
                        <PaymentBadge status={o.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <FulfillmentBadge status={o.fulfillmentStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(o.total)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low inventory alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Low Inventory</CardTitle>
            <CardDescription>
              Active products below {LOW_STOCK_THRESHOLD} units.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                All products are well stocked.
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.lowStock.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="truncate hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={
                        p.inventory === 0
                          ? "font-semibold text-red-500"
                          : "font-semibold text-amber-500"
                      }
                    >
                      {p.inventory} left
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
