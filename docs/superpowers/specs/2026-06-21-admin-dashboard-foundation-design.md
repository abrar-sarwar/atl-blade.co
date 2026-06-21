# ATL Blade Co. — Admin Dashboard, Phase 1 (Foundation) Design

**Date:** 2026-06-21
**Branch:** `feat/admin-dashboard` (isolated; nothing pushed/merged without explicit approval)
**Status:** Approved

## Context

The customer-facing site today is a single 2,700-line static `index.html` (inline CSS + vanilla JS, GSAP animations, no build step), served by `npx serve`. Product data is a hardcoded `PRODUCTS` array; images live in `/assets/<slug>/`. There is no framework, database, auth, cart, or checkout. Prices show "Prices Coming Soon"; Stripe is an unbuilt TODO.

The goal is to eliminate hardcoded content and let ATL Blade Co. run all business operations through an admin dashboard under `/admin` in a single Next.js app, with the customer-facing site eventually database-driven.

## Decisions (from brainstorming)

- **Migration strategy:** Incremental. Stand up the Next.js app + admin + DB first; port customer-facing pages phase by phase; retire the static HTML gradually.
- **Orders:** Build a real cart + Stripe checkout (Phase 4) that writes real orders.
- **Supabase:** New project from scratch.
- **Design fidelity (later phases):** Pixel-faithful port of the existing luxury design.
- **Isolation:** All work on `feat/admin-dashboard`; no pushes until approved.

## Roadmap (6 phases)

1. **Foundation** *(this spec)* — Next.js + TS + Tailwind + shadcn scaffold; Supabase project; full schema + migrations; Google OAuth + roles + RLS; protected `/admin` shell; working Dashboard; seed data. Static site untouched.
2. **Catalog** — Products + Categories CRUD, image upload, search/filter/sort/archive; port Shop + Product detail pages.
3. **Homepage & Settings** — Homepage Editor + Site Settings; port Home + Contact; retire static `index.html`.
4. **Commerce** — Cart + Stripe Checkout + webhooks + Orders module.
5. **Discounts** — Coupons/percentage/fixed/expiry/usage limits, wired into checkout.
6. **Analytics & polish** — Revenue, orders-by-day, top sellers, inventory performance.

The **full 8-table schema is designed up-front in Phase 1** so later phases add only behavior, not schema churn.

---

## Phase 1 Design

### App architecture (clean, scalable)

```
app/
  admin/
    layout.tsx                 # session + role guard, sidebar shell
    page.tsx                   # Dashboard (real, seeded data)
    products/page.tsx          # stub → Phase 2
    categories/page.tsx        # stub → Phase 2
    orders/page.tsx            # stub → Phase 4
    discounts/page.tsx         # stub → Phase 5
    homepage/page.tsx          # stub → Phase 3
    analytics/page.tsx         # stub → Phase 6
    settings/page.tsx          # stub → Phase 3
  api/health/route.ts          # protected example route handler
  auth/callback/route.ts       # Google OAuth callback
  auth/signin/page.tsx         # admin sign-in entry
  layout.tsx, globals.css
lib/
  supabase/{client,server,middleware,admin}.ts   # @supabase/ssr clients + service-role
  db/{products,orders,categories,dashboard}.ts   # typed data-access layer
  validation/*.ts                                # zod schemas (shared)
  types/database.ts                              # supabase-generated types
  auth/guards.ts                                 # requireAdmin(), getCurrentUser()
components/ui/*                                   # shadcn primitives
components/admin/*                                # StatCard, DataTable, Sidebar, etc.
middleware.ts                                    # session refresh + coarse /admin gate
supabase/migrations/*.sql                        # schema, RLS, functions, triggers
supabase/seed.sql                                # seed data
```

- Mutations run through **Server Actions** with server-side **zod** validation and an `is_admin()` re-check. The client is never trusted.
- The `lib/db` layer wraps all Supabase queries and returns typed domain objects; UI never touches raw queries.
- TypeScript types generated from the DB via `supabase gen types`.

### Database schema

**Enums:** `user_role(admin, customer)`, `payment_status(pending, paid, refunded, failed)`, `fulfillment_status(pending, processing, shipped, delivered, cancelled)`, `discount_type(percentage, fixed)`.

**users** — `id uuid pk` (= `auth.users.id`), `email`, `full_name`, `avatar_url`, `role user_role default 'customer'`, `created_at`. Row auto-created by an `on auth.users` insert trigger (`handle_new_user`).

**categories** — `id`, `name`, `slug unique`, `description`, `image_url`, `sort_order int`, `active bool`, `created_at`, `updated_at`.

**products** — `id`, `name`, `slug unique`, `description`, `category_id → categories(id) on delete set null`, `price numeric(10,2)`, `sale_price numeric(10,2)`, `inventory int default 0`, `featured bool`, `active bool` (archive = `active=false`), `tags text[]`, `badge text`, `specs jsonb`, `features text[]`, `created_at`, `updated_at`. The last four support the pixel-faithful port.

**product_images** — `id`, `product_id → products(id) on delete cascade`, `url`, `alt`, `sort_order`, `is_primary`, `created_at`. Added for true normalization of multiple images.

**orders** — `id`, `order_number text unique`, `user_id → users(id)` nullable (guest), `customer_name/email/phone`, `shipping_address jsonb`, `subtotal/discount_total/shipping_total/tax_total/total numeric(10,2)`, `discount_id → discounts(id)` nullable, `payment_status`, `fulfillment_status`, `stripe_payment_intent_id`, `stripe_checkout_session_id`, `notes`, `created_at`, `updated_at`.

**order_items** — `id`, `order_id → orders(id) on delete cascade`, `product_id → products(id) on delete set null`, `product_name` + `product_slug` + `unit_price` (snapshots), `quantity int`, `line_total numeric(10,2)`.

**discounts** — `id`, `code text unique`, `type discount_type`, `value numeric(10,2)`, `starts_at`, `expires_at`, `usage_limit int`, `usage_count int default 0`, `min_subtotal numeric(10,2)`, `active bool`, `created_at`, `updated_at`.

**homepage_settings** — singleton row: `id`, `hero_title`, `hero_subtitle`, `hero_image_url`, `hero_cta_text`, `hero_cta_link`, `hero_gallery jsonb`, `featured_product_ids uuid[]`, `banners jsonb`, `sections jsonb`, `updated_at`.

**site_settings** — singleton row: `id`, `company_name`, `contact_email`, `phone`, `address jsonb`, `shipping_policy`, `return_policy`, `social_links jsonb`, `updated_at`.

### Auth & access control

- **Google OAuth** via Supabase Auth; cookie sessions with `@supabase/ssr`. `middleware.ts` refreshes sessions on every request.
- `/admin/layout.tsx` calls `getUser()` server-side, looks up `role`. **Non-admins → redirect to `/` (homepage).** Unauthenticated → `/auth/signin` (Google).
- **RLS on every table.** Anonymous gets read-only on *active* `products`, `categories`, `product_images`, and both settings tables (so the public site can read them in later phases). All writes are admin-only, gated by a `public.is_admin()` security-definer function. `orders`/`order_items` are written server-side via the service-role client; customers may read their own orders.
- **First-admin bootstrap:** `make_admin(email text)` SQL helper + documented one-liner; the owner email is promoted after first login.

### Dashboard (the fully-built page in Phase 1)

Server Component reading seeded data via `lib/db/dashboard.ts`:
- Total products, total orders, revenue summary (sum of `total` where `payment_status='paid'`).
- Recent orders table (latest 5–10).
- Low-inventory alerts (products with `inventory <` threshold).

Built from reusable `StatCard` + `DataTable`. Other module pages are clean "Coming in Phase N" placeholders inside the working shell with loading/error states wired.

### Seed data

~8 products (the 7 real knives + 1 archived example) with `product_images`, 3–4 categories, a handful of sample orders + items across statuses, one discount, and populated `homepage_settings` + `site_settings`.

### Testing

- **Vitest** for zod validation schemas and `lib/db` helpers (pure logic / mocked client).
- **Playwright** e2e: a non-admin is redirected from `/admin` to `/`.
- RLS sanity-checked via SQL.

### Developer requirements satisfied

Server-side validation (zod in Server Actions) · TS types throughout (generated DB types + domain types) · reusable components (`components/admin/*`) · loading states (Suspense + skeletons) · error handling (error boundaries + typed results) · optimistic UI (groundwork in `DataTable`, applied in later CRUD phases) · clean architecture (UI → server action → validation → `lib/db` → Supabase) · scalable structure (per-entity modules).

### Phase 1 deliverables

Scaffolded Next.js app · Supabase setup guide · all migrations · seed · Google OAuth + roles + RLS · protected `/admin` shell + working Dashboard · local-dev & preview-deploy instructions. Full production-deploy hardening consolidates in Phase 6.

### Out of scope for Phase 1

CRUD for products/categories/orders/discounts; image upload UI; homepage editor; analytics; Stripe checkout; porting any customer-facing page. These are Phases 2–6.

## Risks / notes

- Creating the Supabase cloud project and Google OAuth credentials requires the owner's accounts; the build provides all code, migrations, seed, and exact step-by-step setup instructions, plus a local-Supabase path (`supabase start`) so everything is runnable without cloud access.
- The static `index.html` remains the live customer site until Phase 3 completes.
