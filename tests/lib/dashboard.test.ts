import { describe, it, expect } from "vitest";
import { sumPaidRevenue } from "@/lib/db/dashboard";
import { formatCurrency, slugify } from "@/lib/utils";

describe("sumPaidRevenue", () => {
  it("sums only paid orders and ignores others", () => {
    const revenue = sumPaidRevenue([
      { total: "147.32", payment_status: "paid" },
      { total: "105.03", payment_status: "paid" },
      { total: "158.12", payment_status: "paid" },
      { total: "71.72", payment_status: "pending" },
      { total: "50.00", payment_status: "refunded" },
    ]);
    // Matches the seeded paid revenue verified against the live DB.
    expect(revenue).toBeCloseTo(410.47, 2);
  });

  it("returns 0 when there are no paid orders", () => {
    expect(sumPaidRevenue([{ total: 10, payment_status: "pending" }])).toBe(0);
    expect(sumPaidRevenue([])).toBe(0);
  });

  it("treats null totals as zero", () => {
    expect(
      sumPaidRevenue([{ total: null, payment_status: "paid" }]),
    ).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats numbers as USD", () => {
    expect(formatCurrency(410.47)).toBe("$410.47");
  });
  it("renders a dash for null/undefined", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(formatCurrency(undefined)).toBe("—");
  });
});

describe("slugify", () => {
  it("produces lowercase hyphenated slugs", () => {
    expect(slugify("7” Damascus Skinner Knife")).toBe("7-damascus-skinner-knife");
    expect(slugify("SS & Bone Pocket Knife")).toBe("ss-bone-pocket-knife");
  });
});
