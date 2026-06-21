import type { Database } from "./database";

/** Convenience aliases over the generated Database types. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type UserRow = Tables<"users">;
export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductImage = Tables<"product_images">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Discount = Tables<"discounts">;
export type HomepageSettings = Tables<"homepage_settings">;
export type SiteSettings = Tables<"site_settings">;

export type UserRole = Enums<"user_role">;
export type PaymentStatus = Enums<"payment_status">;
export type FulfillmentStatus = Enums<"fulfillment_status">;
export type DiscountType = Enums<"discount_type">;
