"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { productInputSchema } from "@/lib/validation/product";
import {
  createProduct,
  updateProduct,
  setArchived,
  deleteProduct,
  type ProductImageRow,
} from "@/lib/db/products";
import {
  addImage,
  deleteImageRow,
  setPrimaryImage,
} from "@/lib/db/product-images";
import {
  uploadProductImage,
  removeProductImageObject,
} from "@/lib/storage/products";
import { ok, fail, describeDbError, type ActionResult } from "@/lib/actions/result";

function revalidateProducts(id?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  if (id) revalidatePath(`/admin/products/${id}/edit`);
}

export async function saveProductAction(
  id: string | null,
  raw: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please fix the highlighted fields.", {
      ...parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const product = id
      ? await updateProduct(id, parsed.data)
      : await createProduct(parsed.data);
    revalidateProducts(product.id);
    return ok({ id: product.id });
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function archiveProductAction(
  id: string,
  archived: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setArchived(id, archived);
    revalidateProducts(id);
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await deleteProduct(id);
    revalidateProducts();
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function uploadProductImageAction(
  productId: string,
  formData: FormData,
): Promise<ActionResult<ProductImageRow>> {
  await requireAdmin();
  const file = formData.get("file");
  const alt = (formData.get("alt") as string | null) ?? null;
  if (!(file instanceof File) || file.size === 0) {
    return fail("No file provided.");
  }
  try {
    const url = await uploadProductImage(productId, file);
    const row = await addImage(productId, url, alt);
    revalidateProducts(productId);
    return ok(row);
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function deleteProductImageAction(
  imageId: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const removed = await deleteImageRow(imageId);
    if (removed) {
      await removeProductImageObject(removed.url);
      revalidateProducts(removed.productId);
    }
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}

export async function setPrimaryImageAction(
  productId: string,
  imageId: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await setPrimaryImage(productId, imageId);
    revalidateProducts(productId);
    return ok(undefined);
  } catch (err) {
    return fail(describeDbError(err));
  }
}
