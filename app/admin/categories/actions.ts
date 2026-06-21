"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { categoryInputSchema } from "@/lib/validation/category";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/db/categories";
import { ok, fail, describeDbError, type ActionResult } from "@/lib/actions/result";

function revalidateCategories() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

export async function saveCategoryAction(
  id: string | null,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = categoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", {
      ...parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const category = id
      ? await updateCategory(id, parsed.data)
      : await createCategory(parsed.data);
    revalidateCategories();
    return ok({ id: category.id });
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteCategory(id);
    revalidateCategories();
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}
