import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/db/products";
import { DetailGallery } from "./_components/detail-gallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Not found — ATL Blade Co." };
  return {
    title: `${product.name} — ATL Blade Co.`,
    description: product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const specs = (product.specs as [string, string][]) ?? [];
  const price = product.price != null ? Number(product.price) : null;
  const salePrice = product.sale_price != null ? Number(product.sale_price) : null;

  return (
    <div className="detail-wrap">
      <div className="breadcrumb">
        <Link href="/shop">Shop</Link> &nbsp;/&nbsp; {product.name}
      </div>

      <div className="detail-layout">
        <DetailGallery
          images={product.images.map((i) => ({ url: i.url, alt: i.alt }))}
          name={product.name}
        />

        <div>
          {product.badge ? <span className="badge-corner" style={{ position: "static", display: "inline-block", marginBottom: "1rem" }}>{product.badge}</span> : null}
          <h1 className="detail-name">{product.name}</h1>
          {product.description ? (
            <p className="detail-desc">{product.description}</p>
          ) : null}

          <div className="price" style={{ fontSize: "1.6rem" }}>
            {price == null ? (
              <span className="price soon">Price coming soon</span>
            ) : salePrice != null ? (
              <>
                <span className="was">${price.toFixed(0)}</span>${salePrice.toFixed(0)}
              </>
            ) : (
              <>${price.toFixed(0)}</>
            )}
          </div>

          {specs.length > 0 ? (
            <>
              <div className="detail-section-title">Specifications</div>
              <div className="catalog-specs">
                {specs.map(([label, value], i) => (
                  <div key={i} className="spec-row">
                    <span className="spec-label">{label}</span>
                    <span className="spec-value">{value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {product.features.length > 0 ? (
            <>
              <div className="detail-section-title">Features</div>
              <ul className="feature-list">
                {product.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
