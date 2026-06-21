import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
];

function extFor(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

/**
 * Uploads an image to the product-images bucket and returns its public URL.
 * Uses the service-role client (trusted server op; callers must requireAdmin).
 * Validates size + mime before writing.
 */
export async function uploadProductImage(
  productId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Unsupported image type. Use PNG, JPEG, WebP, or AVIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 10 MB).");
  }

  const supabase = createAdminClient();
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const path = `${productId}/${unique}.${extFor(file.type)}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Removes a previously-uploaded object given its public URL. No-ops for seeded
 * `/products/...` legacy paths (those live in /public, not Storage).
 */
export async function removeProductImageObject(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return; // not a Storage object (e.g. seeded /public asset)
  const path = decodeURIComponent(url.slice(idx + marker.length));

  const supabase = createAdminClient();
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}
