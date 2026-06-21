import { describe, it, expect } from "vitest";
import {
  addItem,
  setQuantity,
  removeItem,
  cartCount,
  type CartItem,
} from "@/lib/commerce/cart";

const base: Omit<CartItem, "quantity"> = {
  productId: "p1",
  slug: "karambit",
  name: "Karambit",
  image: null,
  unitPrice: 129,
};

describe("cart operations", () => {
  it("adds a new item and increments an existing one", () => {
    let items = addItem([], base);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    items = addItem(items, base, 2);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("setQuantity updates or removes at zero", () => {
    const items = addItem([], base, 2);
    expect(setQuantity(items, "p1", 5)[0].quantity).toBe(5);
    expect(setQuantity(items, "p1", 0)).toHaveLength(0);
  });

  it("removeItem drops the line", () => {
    const items = addItem([], base);
    expect(removeItem(items, "p1")).toHaveLength(0);
  });

  it("cartCount sums quantities", () => {
    let items = addItem([], base, 2);
    items = addItem(items, { ...base, productId: "p2", slug: "skinner" }, 3);
    expect(cartCount(items)).toBe(5);
  });
});
