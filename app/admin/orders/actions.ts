"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { updateFulfillmentStatus, updatePaymentStatus } from "@/lib/db/orders";
import { ok, fail, describeDbError, type ActionResult } from "@/lib/actions/result";

const fulfillment = z.enum([
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
const payment = z.enum(["pending", "paid", "refunded", "failed"]);

export async function updateFulfillmentAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = fulfillment.safeParse(status);
  if (!parsed.success) return fail("Invalid status.");
  try {
    await updateFulfillmentStatus(id, parsed.data);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function updatePaymentAction(
  id: string,
  status: string,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = payment.safeParse(status);
  if (!parsed.success) return fail("Invalid status.");
  try {
    await updatePaymentStatus(id, parsed.data);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}
