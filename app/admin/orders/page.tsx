import Link from "next/link";
import { listOrders } from "@/lib/db/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentBadge, FulfillmentBadge } from "@/components/admin/status-badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrdersToolbar } from "./_components/orders-toolbar";
import type { FulfillmentStatus } from "@/lib/types/db";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const sp = await searchParams;
  const orders = await listOrders({
    status: (sp.status as FulfillmentStatus | "all") ?? "all",
    search: sp.search,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
        <p className="text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      <OrdersToolbar />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No orders match your filters.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="hover:text-primary"
                    >
                      {o.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {o.customer_email}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{o.item_count}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(o.total))}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={o.payment_status} />
                  </TableCell>
                  <TableCell>
                    <FulfillmentBadge status={o.fulfillment_status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(o.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
