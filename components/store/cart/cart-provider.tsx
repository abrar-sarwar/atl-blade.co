"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  CART_STORAGE_KEY,
  addItem as addItemPure,
  setQuantity as setQtyPure,
  removeItem as removeItemPure,
  cartCount,
  type CartItem,
} from "@/lib/commerce/cart";
import { cartSubtotal } from "@/lib/commerce/pricing";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQuantity: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load from localStorage on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      // ignore malformed storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const add = useCallback(
    (item: Omit<CartItem, "quantity">, qty = 1) => {
      setItems((cur) => addItemPure(cur, item, qty));
      setDrawerOpen(true);
    },
    [],
  );
  const setQuantity = useCallback(
    (productId: string, qty: number) =>
      setItems((cur) => setQtyPure(cur, productId, qty)),
    [],
  );
  const remove = useCallback(
    (productId: string) => setItems((cur) => removeItemPure(cur, productId)),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      subtotal: cartSubtotal(
        items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
      ),
      hydrated,
      drawerOpen,
      setDrawerOpen,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [items, hydrated, drawerOpen, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
