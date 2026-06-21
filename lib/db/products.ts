import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductImage, Category } from "@/lib/types/db";
import type { ProductInput } from "@/lib/validation/product";

export type ProductImageRow = Pick<
  ProductImage,
  "id" | "url" | "alt" | "sort_order" | "is_primary"
>;

export type ProductListItem = Product & {
  category: Pick<Category, "id" | "name"> | null;
  primary_image: string | null;
};

export type ProductWithImages = Product & {
  images: ProductImageRow[];
};

export type ProductStatusFilter = "all" | "active" | "archived" | "featured";
export type ProductSort =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "price_asc"
  | "price_desc"
  | "inventory_asc";

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  status?: ProductStatusFilter;
  sort?: ProductSort;
};

/** Pure: map a sort key to a Postgres column + direction. Unit-tested. */
export function resolveSort(sort: ProductSort = "newest"): {
  column: string;
  ascending: boolean;
} {
  switch (sort) {
    case "oldest":
      return { column: "created_at", ascending: true };
    case "name_asc":
      return { column: "name", ascending: true };
    case "name_desc":
      return { column: "name", ascending: false };
    case "price_asc":
      return { column: "price", ascending: true };
    case "price_desc":
      return { column: "price", ascending: false };
    case "inventory_asc":
      return { column: "inventory", ascending: true };
    case "newest":
    default:
      return { column: "created_at", ascending: false };
  }
}

/**
 * Admin product list with search, category filter, status filter, and sort.
 * Runs as the admin (RLS-allowed) so archived products are included.
 */
export async function listProducts(
  filters: ProductFilters = {},
): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { column, ascending } = resolveSort(filters.sort);

  let query = supabase
    .from("products")
    .select(
      "*, category:categories(id, name), product_images(url, is_primary, sort_order)",
    );

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }
  switch (filters.status) {
    case "active":
      query = query.eq("active", true);
      break;
    case "archived":
      query = query.eq("active", false);
      break;
    case "featured":
      query = query.eq("featured", true);
      break;
  }

  const { data, error } = await query.order(column, { ascending });
  if (error) throw error;

  return (data ?? []).map((row) => {
    const images = (row.product_images ?? []) as Array<{
      url: string;
      is_primary: boolean;
      sort_order: number;
    }>;
    const primary =
      images.find((i) => i.is_primary) ??
      [...images].sort((a, b) => a.sort_order - b.sort_order)[0];
    const { product_images, category, ...product } = row;
    void product_images;
    return {
      ...(product as Product),
      category: (category as { id: string; name: string } | null) ?? null,
      primary_image: primary?.url ?? null,
    };
  });
}

/** Single product with its images, for the edit form (admin). */
export async function getProduct(id: string): Promise<ProductWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "*, product_images(id, url, alt, sort_order, is_primary)",
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }

  const { product_images, ...product } = data;
  const images = ((product_images ?? []) as ProductImageRow[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return { ...(product as Product), images };
}

/** Public product detail by slug (active only via RLS for anon). */
export async function getProductBySlug(
  slug: string,
): Promise<ProductWithImages | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, product_images(id, url, alt, sort_order, is_primary)")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { product_images, ...product } = data;
  const images = ((product_images ?? []) as ProductImageRow[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  return { ...(product as Product), images };
}

function toRow(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    category_id: input.category_id ?? null,
    price: input.price ?? null,
    sale_price: input.sale_price ?? null,
    inventory: input.inventory,
    featured: input.featured,
    active: input.active,
    tags: input.tags,
    badge: input.badge ?? null,
    specs: input.specs,
    features: input.features,
  };
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return data as Product;
}

export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Product;
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ active: !archived })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
