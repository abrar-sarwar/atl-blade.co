"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/types/db";
import { updateFulfillmentAction, updatePaymentAction } from "../actions";

const FULFILLMENT: FulfillmentStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
const PAYMENT: PaymentStatus[] = ["pending", "paid", "refunded", "failed"];

export function OrderStatusControls({
  orderId,
  fulfillment,
  payment,
}: {
  orderId: string;
  fulfillment: FulfillmentStatus;
  payment: PaymentStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setFulfillment(status: string) {
    startTransition(async () => {
      const res = await updateFulfillmentAction(orderId, status);
      if (res.ok) {
        toast.success("Fulfillment updated");
        router.refresh();
      } else toast.error(res.error);
    });
  }
  function setPayment(status: string) {
    startTransition(async () => {
      const res = await updatePaymentAction(orderId, status);
      if (res.ok) {
        toast.success("Payment status updated");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Fulfillment status</Label>
        <Select
          defaultValue={fulfillment}
          onValueChange={setFulfillment}
          disabled={isPending}
        >
          <SelectTrigger className="capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FULFILLMENT.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Payment status</Label>
        <Select
          defaultValue={payment}
          onValueChange={setPayment}
          disabled={isPending}
        >
          <SelectTrigger className="capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
