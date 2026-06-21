import { z } from "zod";

export const orderFulfillmentSchema = z.object({
  fulfillment_status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

// ---- Site settings ----------------------------------------------------------

const addressSchema = z.object({
  line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
});

export const siteSettingsInputSchema = z.object({
  company_name: z.string().max(120).nullable().optional(),
  contact_email: z
    .string()
    .email("Enter a valid email")
    .nullable()
    .optional()
    .or(z.literal("")),
  phone: z.string().max(40).nullable().optional(),
  address: addressSchema.nullable().optional(),
  shipping_policy: z.string().max(5000).nullable().optional(),
  return_policy: z.string().max(5000).nullable().optional(),
  social_links: z.record(z.string(), z.string()).default({}),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;

// ---- Homepage settings ------------------------------------------------------

export const bannerSchema = z.object({
  text: z.string().min(1, "Banner text is required").max(200),
  link: z.string().max(300).nullable().optional(),
  active: z.boolean().default(true),
});
export type Banner = z.infer<typeof bannerSchema>;

export const sectionSchema = z.object({
  type: z.enum(["about", "quote", "text"]),
  eyebrow: z.string().max(80).nullable().optional(),
  heading: z.string().max(160).nullable().optional(),
  body: z.string().max(4000).nullable().optional(),
  image_url: z.string().max(500).nullable().optional(),
  attribution: z.string().max(120).nullable().optional(),
});
export type HomeSection = z.infer<typeof sectionSchema>;

export const homepageSettingsInputSchema = z.object({
  hero_eyebrow: z.string().max(120).nullable().optional(),
  hero_title: z.string().max(200).nullable().optional(),
  hero_subtitle: z.string().max(600).nullable().optional(),
  hero_image_url: z.string().max(500).nullable().optional(),
  hero_cta_text: z.string().max(60).nullable().optional(),
  hero_cta_link: z.string().max(200).nullable().optional(),
  hero_gallery: z.array(z.string().max(500)).default([]),
  featured_product_ids: z.array(z.string().uuid()).default([]),
  banners: z.array(bannerSchema).default([]),
  sections: z.array(sectionSchema).default([]),
});

export type HomepageSettingsInput = z.infer<typeof homepageSettingsInputSchema>;
