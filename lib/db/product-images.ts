import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProductImageRow } from "@/lib/db/products";

/** Appends an image row. If it's the product's first image, marks it primary. */
export async function addImage(
  productId: string,
  url: string,
  alt: string | null,
): Promise<ProductImageRow> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const isFirst = (count ?? 0) === 0;

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url,
      alt,
      sort_order: count ?? 0,
      is_primary: isFirst,
    })
    .select("id, url, alt, sort_order, is_primary")
    .single();
  if (error) throw error;
  return data as ProductImageRow;
}

export async function deleteImageRow(imageId: string): Promise<{
  productId: string;
  url: string;
  wasPrimary: boolean;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .select("product_id, url, is_primary")
    .single();
  if (error) throw error;
  if (!data) return null;

  // If we removed the primary, promote the next image (by sort order).
  if (data.is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", data.product_id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }

  return {
    productId: data.product_id,
    url: data.url,
    wasPrimary: data.is_primary,
  };
}

export async function setPrimaryImage(
  productId: string,
  imageId: string,
): Promise<void> {
  const supabase = await createClient();
  // Clear existing primary, then set the chosen one.
  const { error: clearErr } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  if (clearErr) throw clearErr;

  const { error } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId);
  if (error) throw error;
}
