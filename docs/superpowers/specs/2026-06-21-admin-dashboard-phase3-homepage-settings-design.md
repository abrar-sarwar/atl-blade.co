# ATL Blade Co. — Phase 3 (Homepage & Settings) Design

**Date:** 2026-06-21
**Branch:** `feat/admin-dashboard` (continues Phases 1–2)
**Depends on:** Phase 1 (schema/auth) + Phase 2 (storefront shell, fonts, CSS)

## Goal

Move the homepage and global site content out of hardcoded files into the
database, editable from the admin, and serve the storefront **Home** + **Contact**
pages from Next.js — fully retiring the static `legacy/index.html` as the live site.

## Scope

**Admin — Homepage Editor** (`/admin/homepage`), backed by `homepage_settings`:
- Hero: title, subtitle, image, CTA text + link, eyebrow.
- Hero gallery: ordered list of image URLs (the rotating showcase).
- Featured products: ordered picker over existing products.
- Promotional banners: repeatable `{ text, link, active }`.
- Homepage sections: repeatable ordered blocks `{ type, eyebrow, heading, body,
  image_url, attribution }` where `type ∈ {about, quote, text}`.

**Admin — Settings** (`/admin/settings`), backed by `site_settings`:
- Company name, contact email, phone, address, shipping policy, return policy,
  social links (instagram, tiktok, …).

**Storefront port (pixel-faithful, DB-driven)**
- `/` Home: hero (text + rotating gallery), marquee strip, featured blades grid,
  about/quote sections, promotional banners, footer — all from the DB.
- `/contact`: company info from settings + a working Web3Forms contact form.
- Retire legacy: `/` is now the real home; store nav "Home" → `/`; remove the
  Phase-1 root placeholder. `legacy/` stays in the repo for reference only.

## Out of scope

Cart/checkout/orders (Phase 4), discounts (Phase 5), analytics (Phase 6). The
GSAP load animation and scroll-reveal choreography from the legacy site are not
reproduced; the static layout, type, palette, and content are faithful.

## Data + architecture

Same layering as Phases 1–2. Singleton rows (`id = true`) updated via upsert.

```
lib/validation/settings.ts   homepageSettingsInputSchema (hero, gallery,
                             featured ids, banners[], sections[]),
                             siteSettingsInputSchema
lib/db/settings.ts           get/update SiteSettings + HomepageSettings
lib/db/products.ts           listFeaturedProducts(ids)  (order-preserving)
app/admin/homepage/          page + form + actions
app/admin/settings/          page + form + actions
app/(store)/page.tsx         Home (DB-driven)
app/(store)/contact/page.tsx Contact (+ Web3Forms form component)
components/store/*            Hero, FeaturedGrid, AboutSection, Quote, Marquee
```

Banners/sections are stored as `jsonb`; validated with zod on save and typed on
read. The about image (`legacy/R.jpg`) is copied to `/public/home/atlanta.jpg`
and referenced from a seeded section; the brand logo to `/public/brand/logo.png`.

## Seed updates

Populate `homepage_settings.sections` with the about block (Zian's story, 2
paragraphs, Atlanta image) and a quote block ("A good knife should feel right…"),
and `banners` with one example, so the ported Home is rich out of the box.

## Testing

- Vitest: section/banner zod schemas; featured-order preservation helper.
- Playwright: `/` renders hero title + featured products from the DB; `/contact`
  shows the seeded contact email; `/admin/homepage` + `/admin/settings` redirect
  anonymous users.

## Risks / decisions

- The Web3Forms access key from the legacy form is reused (public by design);
  the contact form posts client-side to Web3Forms, unchanged in behavior.
- Hero title gold styling: the title renders in the display font; an optional
  `**word**` markup in the title is rendered gold/italic to mimic the legacy
  "gold word", keeping it editable without HTML.
- Marquee words are decorative and remain a fixed component (not DB-driven) —
  YAGNI.
