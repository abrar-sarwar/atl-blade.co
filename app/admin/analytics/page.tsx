import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Boxes,
  AlertTriangle,
} from "lucide-react";
import { getAnalytics, ANALYTICS_WINDOW_DAYS } from "@/lib/db/analytics";
import { StatCard } from "@/components/admin/stat-card";
import { BarChart } from "@/components/admin/bar-chart";
import { RankedList } from "@/components/admin/ranked-list";
import { formatCurrency } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { kpis, ordersByDay, topSellers, inventory } = await getAnalytics();

  const revenueBars = ordersByDay.map((d) => ({
    label: d.date.slice(5), // MM-DD
    value: d.revenue,
    title: `${d.date}: ${formatCurrency(d.revenue)} · ${d.orders} order(s)`,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Performance across paid orders and current inventory.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (paid)" value={formatCurrency(kpis.revenue)} icon={DollarSign} />
        <StatCard label="Paid orders" value={String(kpis.orders)} icon={ShoppingCart} />
        <StatCard label="Units sold" value={String(kpis.unitsSold)} icon={Package} />
        <StatCard
          label="Avg order value"
          value={formatCurrency(kpis.avgOrderValue)}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue — last {ANALYTICS_WINDOW_DAYS} days</CardTitle>
          <CardDescription>Paid order revenue by day (UTC).</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={revenueBars}
            valueFormat={(v) => formatCurrency(v)}
            height={180}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Sellers</CardTitle>
            <CardDescription>By units sold (paid orders).</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedList
              rows={topSellers.map((t) => ({
                label: t.name,
                value: t.units,
                meta: formatCurrency(t.revenue),
              }))}
              valueFormat={(v) => `${v} sold`}
              emptyText="No sales yet."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Performance</CardTitle>
            <CardDescription>Active products only.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                icon={<Boxes className="size-4" />}
                label="Units in stock"
                value={String(inventory.totalUnits)}
              />
              <MiniStat
                icon={<DollarSign className="size-4" />}
                label="Retail value"
                value={formatCurrency(inventory.retailValue)}
              />
              <MiniStat
                icon={<AlertTriangle className="size-4" />}
                label="Out / low"
                value={`${inventory.outOfStock} / ${inventory.lowStock}`}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Low-stock watchlist
              </p>
              <RankedList
                rows={inventory.watchlist.map((w) => ({
                  label: w.name,
                  value: w.inventory,
                }))}
                valueFormat={(v) => `${v} left`}
                emptyText="Everything is well stocked."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
