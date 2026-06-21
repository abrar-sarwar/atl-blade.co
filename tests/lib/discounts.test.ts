import { describe, it, expect } from "vitest";
import { isDiscountLive } from "@/lib/commerce/discounts";

const NOW = Date.parse("2026-06-21T12:00:00.000Z");
const base = {
  active: true,
  starts_at: null,
  expires_at: null,
  usage_limit: null,
  usage_count: 0,
};

describe("isDiscountLive", () => {
  it("is live when active, in window, under limit", () => {
    expect(isDiscountLive(base, NOW)).toBe(true);
  });

  it("is not live when inactive", () => {
    expect(isDiscountLive({ ...base, active: false }, NOW)).toBe(false);
  });

  it("respects the start time", () => {
    expect(
      isDiscountLive({ ...base, starts_at: "2026-06-22T00:00:00.000Z" }, NOW),
    ).toBe(false);
    expect(
      isDiscountLive({ ...base, starts_at: "2026-06-20T00:00:00.000Z" }, NOW),
    ).toBe(true);
  });

  it("respects expiry", () => {
    expect(
      isDiscountLive({ ...base, expires_at: "2026-06-20T00:00:00.000Z" }, NOW),
    ).toBe(false);
    expect(
      isDiscountLive({ ...base, expires_at: "2026-06-30T00:00:00.000Z" }, NOW),
    ).toBe(true);
  });

  it("respects the usage limit", () => {
    expect(
      isDiscountLive({ ...base, usage_limit: 5, usage_count: 5 }, NOW),
    ).toBe(false);
    expect(
      isDiscountLive({ ...base, usage_limit: 5, usage_count: 4 }, NOW),
    ).toBe(true);
  });
});
