"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { shippingFor, FREE_SHIPPING_THRESHOLD } from "@/lib/commerce/pricing";

type AppliedPromo = { code: string; discountTotal: number; total: number };

export function CartDrawer() {
  const { items, subtotal, drawerOpen, setDrawerOpen, setQuantity, remove } =
    useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedPromo | null>(null);

  const lineItems = () =>
    items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

  async function applyPromo() {
    if (!code.trim()) return;
    setApplying(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/discounts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lineItems(), code: code.trim() }),
      });
      const data = await res.json();
      if (data.applied) {
        setApplied({
          code: code.trim().toUpperCase(),
          discountTotal: data.discountTotal,
          total: data.total,
        });
      } else {
        setApplied(null);
        setPromoError(data.error ?? "Invalid code.");
      }
    } catch {
      setPromoError("Could not check that code.");
    } finally {
      setApplying(false);
    }
  }

  function clearPromo() {
    setApplied(null);
    setCode("");
    setPromoError(null);
  }

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lineItems(),
          code: applied?.code ?? null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Checkout failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Checkout failed. Please try again.");
      setLoading(false);
    }
  }

  const shipping = shippingFor(subtotal);

  return (
    <>
      <div
        className={`cart-overlay ${drawerOpen ? "open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden={!drawerOpen}
      />
      <aside
        className={`cart-drawer ${drawerOpen ? "open" : ""}`}
        aria-label="Shopping cart"
      >
        <div className="cart-drawer-head">
          <span>Your Cart</span>
          <button
            className="cart-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <Link
              href="/shop"
              className="btn-outline"
              onClick={() => setDrawerOpen(false)}
            >
              Browse Blades
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((i) => (
                <div key={i.productId} className="cart-item">
                  <div className="cart-item-img">
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt={i.name} />
                    ) : null}
                  </div>
                  <div className="cart-item-body">
                    <div className="cart-item-name">{i.name}</div>
                    <div className="cart-item-price">
                      ${i.unitPrice.toFixed(0)}
                    </div>
                    <div className="cart-qty">
                      <button
                        onClick={() => setQuantity(i.productId, i.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{i.quantity}</span>
                      <button
                        onClick={() => setQuantity(i.productId, i.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        className="cart-remove"
                        onClick={() => remove(i.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-promo">
                {applied ? (
                  <div className="cart-promo-applied">
                    <span>
                      Code <strong>{applied.code}</strong> applied
                    </span>
                    <button className="cart-remove" onClick={clearPromo}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="cart-promo-input">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Promo code"
                      aria-label="Promo code"
                    />
                    <button onClick={applyPromo} disabled={applying || !code.trim()}>
                      {applying ? "…" : "Apply"}
                    </button>
                  </div>
                )}
                {promoError ? <p className="cart-error">{promoError}</p> : null}
              </div>

              <div className="cart-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {applied ? (
                <div className="cart-row muted">
                  <span>Discount ({applied.code})</span>
                  <span>− ${applied.discountTotal.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="cart-row muted">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
              </div>
              {subtotal < FREE_SHIPPING_THRESHOLD && subtotal > 0 ? (
                <p className="cart-note">
                  Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} for free
                  shipping.
                </p>
              ) : null}
              {error ? <p className="cart-error">{error}</p> : null}
              <button
                className="btn-primary cart-checkout"
                onClick={checkout}
                disabled={loading}
              >
                {loading ? "Redirecting…" : "Checkout"}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
