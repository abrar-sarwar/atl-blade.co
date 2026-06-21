"use client";

import { useCart } from "./cart-provider";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    price: number | null;
    salePrice: number | null;
  };
  className?: string;
};

/** Add-to-cart button. Disabled (with a "coming soon" label) when no price. */
export function AddToCart({ product, className }: Props) {
  const { add } = useCart();
  const unit = product.salePrice ?? product.price;

  if (unit == null) {
    return (
      <button className={className ?? "btn-outline"} disabled>
        Price Coming Soon
      </button>
    );
  }

  return (
    <button
      className={className ?? "btn-primary"}
      onClick={() =>
        add({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          unitPrice: unit,
        })
      }
    >
      Add to Cart — ${unit.toFixed(0)}
    </button>
  );
}
