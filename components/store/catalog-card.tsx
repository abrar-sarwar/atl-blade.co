"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type CatalogCardProduct = {
  slug: string;
  name: string;
  description: string | null;
  badge: string | null;
  tags: string[];
  specs: [string, string][];
  price: number | null;
  sale_price: number | null;
  images: string[];
  index: number;
  total: number;
};

export function CatalogCard({ product }: { product: CatalogCardProduct }) {
  const router = useRouter();
  const href = `/products/${product.slug}`;
  const images = product.images.length > 0 ? product.images : [];
  const [active, setActive] = useState(0);

  // The whole card navigates to the product. Image controls below call
  // stopPropagation so browsing photos doesn't trigger this navigation.
  const openProduct = () => router.push(href);

  // Auto-advance the slideshow, matching the legacy marquee feel.
  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % images.length),
      4000,
    );
    return () => clearInterval(id);
  }, [images.length]);

  const go = (dir: number) =>
    setActive((a) => (a + dir + images.length) % images.length);

  const specs = product.specs.slice(0, 3);

  return (
    <article
      className="catalog-card"
      onClick={openProduct}
      role="link"
      tabIndex={0}
      aria-label={`View ${product.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openProduct();
        }
      }}
    >
      {product.badge ? <span className="badge-corner">{product.badge}</span> : null}

      <div className="specimen-strip">
        <span className="specimen-num">
          {String(product.index + 1).padStart(2, "0")}
          <span className="num-of"> / {String(product.total).padStart(2, "0")}</span>
        </span>
        <span className="specimen-tags">
          {product.tags.map((t) => (
            <span key={t} className="tag-chip">
              {t}
            </span>
          ))}
        </span>
      </div>

      <div className="slideshow">
        {images.map((src, i) => (
          <div key={i} className={`slide ${i === active ? "active" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${product.name} view ${i + 1}`} loading="lazy" />
          </div>
        ))}
        {images.length > 1 ? (
          <>
            <button
              className="slide-arrow prev"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="slide-arrow next"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next image"
            >
              ›
            </button>
            <span className="slide-counter">
              {String(active + 1).padStart(2, "0")} /{" "}
              {String(images.length).padStart(2, "0")}
            </span>
            <div className="slide-dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`slide-dot ${i === active ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(i);
                  }}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="catalog-body">
        <div>
          <h3 className="catalog-name">{product.name}</h3>
        </div>
        {product.description ? (
          <p className="catalog-desc">{product.description}</p>
        ) : null}

        {specs.length > 0 ? (
          <div>
            <div className="catalog-subhead">Specifications</div>
            <div className="catalog-specs">
              {specs.map(([label, value], i) => (
                <div key={i} className="spec-row">
                  <span className="spec-label">{label}</span>
                  <span className="spec-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="catalog-foot">
          <Price price={product.price} salePrice={product.sale_price} />
          <Link href={`/products/${product.slug}`} className="btn-detail">
            Details →
          </Link>
        </div>
      </div>
    </article>
  );
}

function Price({
  price,
  salePrice,
}: {
  price: number | null;
  salePrice: number | null;
}) {
  if (price == null) return <span className="price soon">Price coming soon</span>;
  if (salePrice != null) {
    return (
      <span className="price">
        <span className="was">${price.toFixed(0)}</span>${salePrice.toFixed(0)}
      </span>
    );
  }
  return <span className="price">${price.toFixed(0)}</span>;
}
