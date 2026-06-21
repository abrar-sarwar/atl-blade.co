"use client";

import { useCart } from "./cart-provider";

export function CartButton() {
  const { count, setDrawerOpen, hydrated } = useCart();
  return (
    <button
      className="cart-button"
      onClick={() => setDrawerOpen(true)}
      aria-label={`Cart (${count} items)`}
    >
      Cart
      {hydrated && count > 0 ? (
        <span className="cart-badge">{count}</span>
      ) : null}
    </button>
  );
}
