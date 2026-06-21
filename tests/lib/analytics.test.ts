import { describe, it, expect } from "vitest";
import {
  buildOrdersByDay,
  buildTopSellers,
  buildInventoryStats,
  summarizeKpis,
} from "@/lib/analytics/aggregate";

describe("buildOrdersByDay", () => {
  it("returns one bucket per day, oldest first, filling gaps with zeros", () => {
    const buckets = buildOrdersByDay(
      [
        { total: 100, created_at: "2026-06-21T10:00:00.000Z" },
        { total: 50, created_at: "2026-06-21T18:00:00.000Z" },
        { total: 200, created_at: "2026-06-19T09:00:00.000Z" },
      ],
      3,
      "2026-06-21",
    );
    expect(buckets.map((b) => b.date)).toEqual([
      "2026-06-19",
      "2026-06-20",
      "2026-06-21",
    ]);
    expect(buckets[0]).toEqual({ date: "2026-06-19", orders: 1, revenue: 200 });
    expect(buckets[1]).toEqual({ date: "2026-06-20", orders: 0, revenue: 0 });
    expect(buckets[2]).toEqual({ date: "2026-06-21", orders: 2, revenue: 150 });
  });

  it("ignores orders outside the window", () => {
    const buckets = buildOrdersByDay(
      [{ total: 999, created_at: "2026-01-01T00:00:00.000Z" }],
      2,
      "2026-06-21",
    );
    expect(buckets.reduce((s, b) => s + b.revenue, 0)).toBe(0);
  });
});

describe("buildTopSellers", () => {
  it("aggregates by product, ranks by units, respects the limit", () => {
    const top = buildTopSellers(
      [
        { product_id: "a", product_name: "Karambit", quantity: 2, line_total: 258 },
        { product_id: "b", product_name: "Skinner", quantity: 5, line_total: 695 },
        { product_id: "a", product_name: "Karambit", quantity: 1, line_total: 129 },
      ],
      2,
    );
    expect(top).toHaveLength(2);
    expect(top[0]).toEqual({
      productId: "b",
      name: "Skinner",
      units: 5,
      revenue: 695,
    });
    expect(top[1]).toEqual({
      productId: "a",
      name: "Karambit",
      units: 3,
      revenue: 387,
    });
  });
});

describe("buildInventoryStats", () => {
  it("computes totals, retail value, and out/low counts", () => {
    const stats = buildInventoryStats(
      [
        { id: "1", name: "A", inventory: 0, price: 100 },
        { id: "2", name: "B", inventory: 3, price: 50 },
        { id: "3", name: "C", inventory: 20, price: 10 },
      ],
      5,
    );
    expect(stats.totalUnits).toBe(23);
    expect(stats.retailValue).toBe(0 * 100 + 3 * 50 + 20 * 10); // 350
    expect(stats.outOfStock).toBe(1);
    expect(stats.lowStock).toBe(1); // B (3 < 5); A is out-of-stock
    expect(stats.watchlist.map((w) => w.name)).toEqual(["A", "B"]); // sorted asc
  });
});

describe("summarizeKpis", () => {
  it("computes revenue, orders, units, and AOV", () => {
    const kpis = summarizeKpis(
      [
        { total: "147.32", created_at: "x" },
        { total: "105.03", created_at: "x" },
        { total: "158.12", created_at: "x" },
      ],
      [
        { product_id: "a", product_name: "A", quantity: 1, line_total: 0 },
        { product_id: "b", product_name: "B", quantity: 2, line_total: 0 },
      ],
    );
    expect(kpis.revenue).toBeCloseTo(410.47, 2);
    expect(kpis.orders).toBe(3);
    expect(kpis.unitsSold).toBe(3);
    expect(kpis.avgOrderValue).toBeCloseTo(136.82, 2);
  });

  it("avoids divide-by-zero with no orders", () => {
    expect(summarizeKpis([], []).avgOrderValue).toBe(0);
  });
});
