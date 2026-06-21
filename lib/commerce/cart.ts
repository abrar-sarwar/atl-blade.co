import type { PricedLine } from "./pricing";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
};

export const CART_STORAGE_KEY = "atlblade.cart.v1";

/** Add (or increment) an item, returning a new array. */
export function addItem(
  items: CartItem[],
  item: Omit<CartItem, "quantity">,
  qty = 1,
): CartItem[] {
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    return items.map((i) =>
      i.productId === item.productId
        ? { ...i, quantity: i.quantity + qty }
        : i,
    );
  }
  return [...items, { ...item, quantity: qty }];
}

export function setQuantity(
  items: CartItem[],
  productId: string,
  qty: number,
): CartItem[] {
  if (qty <= 0) return removeItem(items, productId);
  return items.map((i) =>
    i.productId === productId ? { ...i, quantity: qty } : i,
  );
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function toPricedLines(items: CartItem[]): PricedLine[] {
  return items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity }));
}
