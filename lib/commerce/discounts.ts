/** Pure discount-status logic — no I/O, unit-tested. */

export type DiscountStatusInput = {
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  usage_limit: number | null;
  usage_count: number;
};

/**
 * Whether a discount can currently be redeemed: active, within its time window,
 * and under its usage limit. `now` is epoch milliseconds.
 */
export function isDiscountLive(d: DiscountStatusInput, now: number): boolean {
  if (!d.active) return false;
  if (d.starts_at && new Date(d.starts_at).getTime() > now) return false;
  if (d.expires_at && new Date(d.expires_at).getTime() < now) return false;
  if (d.usage_limit != null && d.usage_count >= d.usage_limit) return false;
  return true;
}
