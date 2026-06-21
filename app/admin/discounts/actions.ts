"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { discountInputSchema } from "@/lib/validation/discount";
import {
  createDiscount,
  updateDiscount,
  setDiscountActive,
  deleteDiscount,
} from "@/lib/db/discounts";
import { ok, fail, describeDbError, type ActionResult } from "@/lib/actions/result";

function revalidateDiscounts() {
  revalidatePath("/admin/discounts");
}

export async function saveDiscountAction(
  id: string | null,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = discountInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", {
      ...parsed.error.flatten().fieldErrors,
    });
  }
  try {
    const discount = id
      ? await updateDiscount(id, parsed.data)
      : await createDiscount(parsed.data);
    revalidateDiscounts();
    return ok({ id: discount.id });
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function toggleDiscountActiveAction(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setDiscountActive(id, active);
    revalidateDiscounts();
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function deleteDiscountAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteDiscount(id);
    revalidateDiscounts();
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}
