import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getOrder } from "@/lib/db/orders";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusControls } from "../_components/order-status-controls";

export const dynamic = "force-dynamic";

type Address = Record<string, string | undefined> | null;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const address = order.shipping_address as Address;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {order.order_number}
          </h2>
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.created_at)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell>{it.product_name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(it.unit_price))}
                      </TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(it.line_total))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <dl className="mt-4 space-y-1 text-sm">
                <Row label="Subtotal" value={formatCurrency(Number(order.subtotal))} />
                {Number(order.discount_total) > 0 ? (
                  <Row
                    label="Discount"
                    value={`− ${formatCurrency(Number(order.discount_total))}`}
                  />
                ) : null}
                <Row
                  label="Shipping"
                  value={formatCurrency(Number(order.shipping_total))}
                />
                <Row
                  label="Total"
                  value={formatCurrency(Number(order.total))}
                  strong
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusControls
                orderId={order.id}
                fulfillment={order.fulfillment_status}
                payment={order.payment_status}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{order.customer_name}</div>
              <div className="text-muted-foreground">{order.customer_email}</div>
              {order.customer_phone ? (
                <div className="text-muted-foreground">
                  {order.customer_phone}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {address ? (
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5 text-sm text-muted-foreground">
                {address.line1 ? <div>{address.line1}</div> : null}
                {address.line2 ? <div>{address.line2}</div> : null}
                <div>
                  {[address.city, address.state, address.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                {address.country ? <div>{address.country}</div> : null}
              </CardContent>
            </Card>
          ) : null}

          {order.stripe_payment_intent_id ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 break-all text-xs text-muted-foreground">
                <div>PaymentIntent: {order.stripe_payment_intent_id}</div>
                {order.stripe_checkout_session_id ? (
                  <div>Session: {order.stripe_checkout_session_id}</div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${strong ? "border-t pt-2 font-semibold" : "text-muted-foreground"}`}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
