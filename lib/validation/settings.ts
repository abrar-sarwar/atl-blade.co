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

export const siteSettingsInputSchema = z.object({
  company_name: z.string().max(120).nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  shipping_policy: z.string().max(5000).nullable().optional(),
  return_policy: z.string().max(5000).nullable().optional(),
  social_links: z
    .record(z.string(), z.string().url())
    .default({}),
});

export const homepageSettingsInputSchema = z.object({
  hero_title: z.string().max(200).nullable().optional(),
  hero_subtitle: z.string().max(400).nullable().optional(),
  hero_image_url: z.string().nullable().optional(),
  hero_cta_text: z.string().max(60).nullable().optional(),
  hero_cta_link: z.string().max(200).nullable().optional(),
  featured_product_ids: z.array(z.string().uuid()).default([]),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
export type HomepageSettingsInput = z.infer<typeof homepageSettingsInputSchema>;
