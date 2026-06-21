import Link from "next/link";
import { getHomepageSettings } from "@/lib/db/settings";
import { listFeaturedProducts } from "@/lib/db/products";
import { HeroGallery, HeroTitle } from "@/components/store/hero-gallery";
import { Marquee } from "@/components/store/marquee";
import { HomeSections } from "@/components/store/home-sections";
import type { Banner, HomeSection } from "@/lib/validation/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "ATL Blade Co. — Handmade Knives from Atlanta",
  description: "Handmade knives, forged one at a time in Atlanta by Zian Bhutta.",
};

export default async function HomePage() {
  const settings = await getHomepageSettings();
  const featuredIds = (settings?.featured_product_ids as string[]) ?? [];
  const featured = await listFeaturedProducts(featuredIds);

  const banners = ((settings?.banners as Banner[]) ?? []).filter((b) => b.active);
  const sections = (settings?.sections as HomeSection[]) ?? [];
  const gallery =
    (settings?.hero_gallery as string[])?.length
      ? (settings!.hero_gallery as string[])
      : settings?.hero_image_url
        ? [settings.hero_image_url]
        : [];
  const ctaLink = settings?.hero_cta_link || "/shop";
  const ctaText = settings?.hero_cta_text || "Shop Collection";

  return (
    <>
      {banners.map((b, i) =>
        b.link ? (
          <Link key={i} href={b.link} className="promo-banner block">
            {b.text}
          </Link>
        ) : (
          <div key={i} className="promo-banner">
            {b.text}
          </div>
        ),
      )}

      <section className="hero">
        <div className="hero-content">
          <div>
            {settings?.hero_eyebrow ? (
              <div className="hero-eyebrow">{settings.hero_eyebrow}</div>
            ) : null}
            <HeroTitle title={settings?.hero_title ?? "Handmade Knives"} />
            {settings?.hero_subtitle ? (
              <p className="hero-tagline">{settings.hero_subtitle}</p>
            ) : null}
            <div className="hero-ctas">
              <Link href={ctaLink} className="btn-primary">
                {ctaText}
              </Link>
              <Link href="/contact" className="btn-outline">
                Contact
              </Link>
            </div>
          </div>
          <div className="hero-showcase">
            <HeroGallery images={gallery} alt="Featured blade" />
          </div>
        </div>
      </section>

      <Marquee />

      {featured.length > 0 ? (
        <section className="featured">
          <div className="featured-header">
            <div className="section-label">Our Collection</div>
            <div className="section-divider" />
            <h2 className="section-title">
              Featured <em>Blades</em>
            </h2>
          </div>
          <div className="featured-grid">
            {featured.map((p) => {
              const img =
                p.images.find((i) => i.is_primary)?.url ?? p.images[0]?.url;
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="featured-card"
                >
                  <div className="img">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={p.name} />
                    ) : null}
                  </div>
                  <div className="body">
                    <div className="name">{p.name}</div>
                    {p.description ? (
                      <div className="desc">{p.description}</div>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: "3rem" }}>
            <Link href="/shop" className="btn-primary">
              View Full Collection
            </Link>
          </div>
        </section>
      ) : null}

      <HomeSections sections={sections} />
    </>
  );
}
