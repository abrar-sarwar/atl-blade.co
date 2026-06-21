# ATL Blade Co. — Phase 2 (Catalog) Design

**Date:** 2026-06-21
**Branch:** `feat/admin-dashboard` (continues Phase 1; nothing pushed without approval)
**Depends on:** Phase 1 Foundation (schema, auth, admin shell, RLS)

## Goal

Make the catalog fully manageable from the admin dashboard, and serve the
public storefront's Shop + Product pages from the database (pixel-faithful to
the legacy static site).

## Scope

**Admin — Products (full CRUD)**
- List: search by name, filter by category, filter by status (active/archived/
  featured), sort (name, price, inventory, created), with thumbnail, price,
  inventory, status badges, and row actions.
- Create / edit: all product fields — name, slug (auto from name, editable),
  description, category, price, sale_price, inventory, featured, active, tags,
  badge, specs (label/value rows), features (list).
- Multiple image upload to Supabase Storage; set primary; reorder; delete.
- Archive (active=false) / unarchive toggle; hard delete (with confirm).

**Admin — Categories (CRUD)**
- List, create, edit, delete. Deleting sets member products' category to null
  (FK `on delete set null`). Products are assigned to a category from the
  product form.

**Storefront port (pixel-faithful)**
- `/shop` — compliance strip, filter row (All / Damascus / Pocket / Outdoor /
  Tactical via `tags`), responsive card grid reading active products from DB.
- `/products/[slug]` — gallery (primary + thumbs), specs table, features list,
  breadcrumb. Reached from a Shop card.
- Brand styling: Cormorant Garamond + Cinzel + Raleway, gold palette, dark
  luxury — matching `legacy/index.html`.

## Out of scope (later phases)

Cart / checkout / Stripe / orders (Phase 4), homepage editor + settings UI +
porting Home/Contact (Phase 3), discounts (Phase 5), analytics (Phase 6).
"Add to Cart" on storefront shows "Prices Coming Soon"/inquire, matching today.

## Architecture

Follows Phase 1 layering: **UI → Server Action → zod → `lib/db` → Supabase**,
`requireAdmin()` server-side, RLS at the DB.

```
lib/db/products.ts        listProducts(filters) / getProduct(id) / getProductBySlug /
                          createProduct / updateProduct / setArchived / deleteProduct /
                          addImages / deleteImage / setPrimaryImage / reorderImages
lib/db/categories.ts      listCategories / getCategory / createCategory /
                          updateCategory / deleteCategory
lib/storage/products.ts   uploadProductImage / removeProductImage (Storage)
app/admin/products/        page (list), new/page, [id]/edit/page, _components/*, actions.ts
app/admin/categories/      page (list + inline dialogs), actions.ts
app/(store)/shop/page.tsx          public shop
app/(store)/products/[slug]/page.tsx  public product detail
app/(store)/layout.tsx             storefront brand shell (fonts)
components/store/*         ProductCard, Gallery, FilterBar, etc.
components/admin/data-table-shell.tsx, image-uploader.tsx, spec-editor.tsx
```

### Image storage

- Supabase Storage bucket `product-images` (public read; writes via admin /
  service role). Migration `0004_storage.sql` creates the bucket + policies.
- `product_images.url` stores either a Storage public URL (new uploads) or the
  seeded `/products/...` public path (legacy assets) — both render. New uploads
  go to Storage; seeded rows keep working.
- Upload flow: client uploads file to Storage via a server action that streams
  through the service-role client (validates type/size, admin-gated), inserts a
  `product_images` row, returns the new row.

### Server Actions & validation

- Reuse `productInputSchema` / `categoryInputSchema` (Phase 1). Slug uniqueness
  checked in the action (friendly error on conflict).
- Each action: `requireAdmin()` → `zod.parse` → `lib/db` → `revalidatePath`.
- Optimistic UI on archive toggle and image delete; forms use pending states.

### Storefront data

- Server Components read active products/images/categories via the anon-RLS
  path. Filtering by tag is done in-query. Detail uses `getProductBySlug`.

## Testing

- Vitest: product list filter/sort builder helper (pure), slug-conflict mapping.
- Playwright: `/admin/products` blocked for anon; `/shop` lists products and a
  product card links to a working detail page.

## Risks / decisions

- Pixel-faithful port is the largest lift; the storefront uses its own brand
  layout (fonts via `next/font` or Google `<link>`), independent of the admin
  theme. Admin keeps the existing shadcn theme.
- Hard delete of a product with order history is blocked by FK (`order_items.
  product_id on delete set null` keeps history); deleting is allowed and order
  snapshots remain intact. UI nudges "archive" as the default.
- The static `legacy/` Home/Contact remain live until Phase 3; only Shop +
  Product move to Next.js now. A temporary nav decision: the ported Shop pages
  are reachable directly; full nav unification happens in Phase 3.
