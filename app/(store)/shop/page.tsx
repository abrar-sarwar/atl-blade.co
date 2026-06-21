import { Suspense } from "react";
import { listStorefrontProducts } from "@/lib/db/products";
import { CatalogCard } from "@/components/store/catalog-card";
import { FilterBar } from "./_components/filter-bar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop — ATL Blade Co.",
  description: "Handmade knives, forged one at a time in Atlanta.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const products = await listStorefrontProducts(filter);

  return (
    <>
      <section className="shop-hero">
        <p className="section-label">The Collection</p>
        <div className="section-divider" />
        <h1>
          Forged <em>Blades</em>
        </h1>
      </section>

      <section className="compliance-strip">
        <div className="compliance-grid">
          <div className="compliance-item">
            <div className="compliance-title">18+ Only</div>
            <div className="compliance-copy">Must be of legal age to purchase.</div>
          </div>
          <div className="compliance-item">
            <div className="compliance-title">Handmade</div>
            <div className="compliance-copy">Each piece is one of a kind.</div>
          </div>
          <div className="compliance-item">
            <div className="compliance-title">Atlanta, GA</div>
            <div className="compliance-copy">Forged in the USA.</div>
          </div>
        </div>
      </section>

      <Suspense>
        <FilterBar />
      </Suspense>

      <section className="shop-grid-section">
        {products.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--silver)" }}>
            No blades in this category yet.
          </p>
        ) : (
          <div className="shop-grid">
            {products.map((p, i) => (
              <CatalogCard
                key={p.id}
                product={{
                  slug: p.slug,
                  name: p.name,
                  description: p.description,
                  badge: p.badge,
                  tags: p.tags,
                  specs: (p.specs as [string, string][]) ?? [],
                  price: p.price != null ? Number(p.price) : null,
                  sale_price: p.sale_price != null ? Number(p.sale_price) : null,
                  images: p.images.map((img) => img.url),
                  index: i,
                  total: products.length,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
