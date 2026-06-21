import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Discount } from "@/lib/types/db";
import type { DiscountInput } from "@/lib/validation/discount";

export async function listDiscounts(): Promise<Discount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Discount[];
}

export async function getDiscount(id: string): Promise<Discount | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Discount) ?? null;
}

function toRow(input: DiscountInput) {
  return {
    code: input.code.toUpperCase(),
    type: input.type,
    value: input.value,
    starts_at: input.starts_at ?? null,
    expires_at: input.expires_at ?? null,
    usage_limit: input.usage_limit ?? null,
    min_subtotal: input.min_subtotal ?? null,
    active: input.active,
  };
}

export async function createDiscount(input: DiscountInput): Promise<Discount> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) throw error;
  return data as Discount;
}

export async function updateDiscount(
  id: string,
  input: DiscountInput,
): Promise<Discount> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("discounts")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Discount;
}

export async function setDiscountActive(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("discounts")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDiscount(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) throw error;
}
