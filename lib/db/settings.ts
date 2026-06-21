import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings, HomepageSettings } from "@/lib/types/db";
import type { SiteSettingsInput, HomepageSettingsInput } from "@/lib/validation/settings";

/** The single site-settings row (id is always true). */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return (data as SiteSettings) ?? null;
}

/** The single homepage-settings row (id is always true). */
export async function getHomepageSettings(): Promise<HomepageSettings | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homepage_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return (data as HomepageSettings) ?? null;
}

/** Upsert the singleton site-settings row. */
export async function updateSiteSettings(
  input: SiteSettingsInput,
): Promise<SiteSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(
      {
        id: true,
        company_name: input.company_name ?? null,
        contact_email: input.contact_email || null,
        phone: input.phone ?? null,
        address: input.address ?? null,
        shipping_policy: input.shipping_policy ?? null,
        return_policy: input.return_policy ?? null,
        social_links: input.social_links ?? {},
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as SiteSettings;
}

/** Upsert the singleton homepage-settings row. */
export async function updateHomepageSettings(
  input: HomepageSettingsInput,
): Promise<HomepageSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homepage_settings")
    .upsert(
      {
        id: true,
        hero_eyebrow: input.hero_eyebrow ?? null,
        hero_title: input.hero_title ?? null,
        hero_subtitle: input.hero_subtitle ?? null,
        hero_image_url: input.hero_image_url ?? null,
        hero_cta_text: input.hero_cta_text ?? null,
        hero_cta_link: input.hero_cta_link ?? null,
        hero_gallery: input.hero_gallery,
        featured_product_ids: input.featured_product_ids,
        banners: input.banners,
        sections: input.sections,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as HomepageSettings;
}
