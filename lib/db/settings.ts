import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SiteSettings, HomepageSettings } from "@/lib/types/db";

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
