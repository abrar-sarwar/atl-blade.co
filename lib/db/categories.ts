import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types/db";
import type { CategoryInput } from "@/lib/validation/category";

export type CategoryWithCount = Category & { product_count: number };

/** Categories with their product counts, ordered for the admin list + selects. */
export async function listCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const { products, ...category } = row as Category & {
      products: { count: number }[];
    };
    return {
      ...(category as Category),
      product_count: products?.[0]?.count ?? 0,
    };
  });
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Category) ?? null;
}

function toRow(input: CategoryInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    image_url: input.image_url ?? null,
    sort_order: input.sort_order,
    active: input.active,
  };
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Category;
}

/** Deletes a category. Member products' category_id is set null by the FK. */
export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
