# ATL Blade Co.

Marketing site and product catalog for ATL Blade Co., a small knife shop run by Zian Bhutta out of Atlanta, GA.

The whole site is a single `index.html` with inline CSS and JS — no build step. GSAP handles the page-load animations and the marquee strip.

## Run locally

```bash
npm run dev
```

That runs `npx serve .` on the default port. Open the printed URL in a browser.

## Project layout

```
index.html              Whole site (HTML + CSS + JS, ~2700 lines)
atlbladecologo.png      Brand mark (used in nav, footer, loader, craft banner)
R.jpg                   Atlanta skyline photo used in the About section
assets/                 Product photos
package.json            Dev-server script
```

## Adding or editing products

All product data lives in the `PRODUCTS` array near the top of the inline `<script>` block in `index.html`. Each entry looks like this:

```js
{
  id: 8,
  name: "Some New Knife",
  slugBase: "Some-New-Knife",   // must match filenames in /assets
  imageCount: 3,                // number of photos for the slideshow
  tags: ["damascus", "pocket"], // used by the shop filters
  badge: "New",                 // optional gold corner badge
  description: "One-line product description.",
  specs: [
    ["Overall Length", "5\""],
    ["Blade", "Damascus steel"]
  ],
  features: [
    "First feature",
    "Second feature"
  ]
}
```

Images must be saved in `/assets/` named `<slugBase>1.png`, `<slugBase>2.png`, etc. Special characters (`&`, `"`) in the filename are fine — `productImage()` URL-encodes them at render time.

The homepage **Featured Blades** strip is hardcoded to show product IDs `[7, 2, 5]` (Karambit, Damascus Pakkawood USA Pocket Knife, 7" Damascus Skinner). Change the `featuredIds` array in `renderFeatured()` to swap them out.

The hero auto-rotating gallery is hardcoded in the markup — search for `<div class="hero-gallery"` to swap which three photos play in the loop.

## Filters

The shop page has five filter buttons (All Blades / Damascus / Pocket / Outdoor / Tactical). They match against the `tags` array on each product. Each footer "Shop" link calls `goToShopFiltered(label)` which lands on the shop page and clicks the matching filter.

## Pages

The site is a single-page app with a custom router. Pages are sibling `<div class="page" id="page-X">` blocks; only one has the `.active` class at a time. Navigate with `goTo('home' | 'shop' | 'detail' | 'contact' | 'privacy')`.

- `home` — hero, featured blades, about (Zian's story), craft banner, footer
- `shop` — compliance strip, filter row, 7-card catalog with per-card slideshow
- `detail` — product gallery + specs + features (reached by clicking "Details →" on a catalog card)
- `contact` — info + form
- `privacy` — privacy policy

## Deployment

Vercel-ready as a static site. The `assets/` folder ships at the root, so all `<img src="assets/...">` paths resolve correctly. No `next.config` or build step needed.

## To do

- Stripe Products + Prices for each knife, wire up the "Add to Cart" buttons.
- Age-gate modal on first visit to `/shop` (the compliance strip notes 18+ but doesn't enforce).
- Real returns / shipping / terms pages — currently the privacy policy is the only legal content.
- Hook up the contact form to an email handler (currently the submit just shows a success toast).

## Contact

- Email: atlbladeco@gmail.com
- Phone: (404) 944-1159
- Instagram: [@atlbladeco](https://www.instagram.com/atlbladeco/)
- TikTok: [@atlbladeco](https://www.tiktok.com/@atlbladeco)
