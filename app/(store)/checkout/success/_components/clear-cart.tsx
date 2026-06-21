"use client";

import { useEffect } from "react";
import { useCart } from "@/components/store/cart/cart-provider";

/** Empties the cart once the order is placed. */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
