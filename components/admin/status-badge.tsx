import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus, FulfillmentStatus } from "@/lib/types/db";

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  refunded: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  failed: "bg-red-500/15 text-red-600 dark:text-red-400",
};

const FULFILLMENT_STYLES: Record<FulfillmentStatus, string> = {
  pending: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  processing: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  shipped: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  delivered: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", PAYMENT_STYLES[status])}>
      {status}
    </Badge>
  );
}

export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  return (
    <Badge
      variant="secondary"
      className={cn("capitalize", FULFILLMENT_STYLES[status])}
    >
      {status}
    </Badge>
  );
}
