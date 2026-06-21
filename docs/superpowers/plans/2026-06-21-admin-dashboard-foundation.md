# Admin Dashboard — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Execute task-by-task, committing per task.

**Goal:** Stand up a Next.js + TypeScript + Tailwind + shadcn app with Supabase (Postgres + Auth), Google OAuth, role-based protected `/admin` routes, the full normalized 8-table schema with RLS, seed data, and a working Dashboard — without touching the live static site.

**Architecture:** Single Next.js App-Router app. The existing static site stays in `legacy/` and is untouched. UI → Server Action → zod validation → `lib/db` data-access layer → Supabase. Auth via `@supabase/ssr` cookie sessions; `/admin` guarded by a server-side role check in the layout plus `middleware.ts`. RLS enforces admin-only writes at the database.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Supabase (supabase-js + @supabase/ssr), PostgreSQL, zod, Vitest, Playwright.

## Global Constraints

- All work on branch `feat/admin-dashboard`. No pushes/merges without explicit approval.
- The live customer site = existing static `index.html`; it must keep working. Move it into `legacy/` and serve nothing from Next.js that breaks it.
- All `/admin` routes and admin API endpoints require an authenticated user with `users.role = 'admin'`; unauthorized → redirect to `/`.
- Server-side validation on every mutation (zod). TypeScript types throughout. No secrets committed.
- Money stored as `numeric(10,2)`; statuses use Postgres enums.
- Supabase setup must be runnable both against a new cloud project and a local `supabase start` stack.

---

## Task 1: Scaffold Next.js app alongside the static site

**Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`, `.gitignore`, `.env.example`, `legacy/` (moved static assets)

- [ ] Move static site into `legacy/` (`index.html`, `assets/`, `*.png`, `R.jpg`, `README.md`) so Next.js owns the root. Keep a note that `legacy/` is the live site until Phase 3.
- [ ] Initialize Next.js (App Router, TS, Tailwind v4, ESLint, `src`-less layout) over the existing repo. Set `package.json` scripts: `dev`, `build`, `start`, `lint`, `test`, `test:e2e`, `db:types`.
- [ ] Add `.env.example` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`. Add `.env.local` to `.gitignore`.
- [ ] Minimal root layout + a placeholder home page (`/`) that links to `/admin`. Verify `npm run build` passes.
- [ ] Commit: "Scaffold Next.js app; move static site to legacy/".

## Task 2: shadcn/ui + Tailwind theme

**Files:** `components.json`, `lib/utils.ts`, `components/ui/*`, `app/globals.css`

- [ ] Init shadcn and add: `button`, `card`, `input`, `label`, `table`, `badge`, `dropdown-menu`, `avatar`, `separator`, `sonner` (toast), `skeleton`, `sheet`, `dialog`, `select`, `tooltip`.
- [ ] Add dark luxury theme tokens (gold accent `#c9a84c`, near-black bg) in `globals.css` so the admin matches the brand.
- [ ] Verify build. Commit: "Add shadcn/ui and brand theme".

## Task 3: Supabase project config + database migration (schema, enums, triggers)

**Files:** `supabase/config.toml`, `supabase/migrations/0001_init_schema.sql`

- [ ] `supabase init`. Configure `auth` with Google provider placeholders in `config.toml`.
- [ ] Write `0001_init_schema.sql`: the four enums; tables `users, categories, products, product_images, orders, order_items, discounts, homepage_settings, site_settings` exactly per spec; `updated_at` trigger function; `handle_new_user` trigger on `auth.users` (creates `public.users`, sets role `admin` when email ∈ `ADMIN_EMAILS` via a settings table or hardcoded check, else `customer`).
- [ ] Indexes: `products(category_id)`, `products(active)`, `products(slug)`, `order_items(order_id)`, `orders(created_at)`, `discounts(code)`.
- [ ] Commit: "Add initial schema migration".

## Task 4: RLS policies + helper functions

**Files:** `supabase/migrations/0002_rls.sql`

- [ ] `public.is_admin()` security-definer fn (checks `auth.uid()` → `users.role='admin'`). `public.make_admin(text)` helper.
- [ ] Enable RLS on all tables. Policies: anon/auth `select` on active `products`, `categories`, `product_images` (+ parent active), and both settings tables; admin full CRUD on everything via `is_admin()`; users can `select`/`update` their own row; customers `select` their own orders/order_items.
- [ ] Commit: "Add RLS policies and admin helpers".

## Task 5: Seed data

**Files:** `supabase/seed.sql`

- [ ] Seed 3–4 categories; 8 products (7 real knives w/ tags, specs, features, badges from `legacy/index.html`'s PRODUCTS array + 1 archived); `product_images` rows pointing at `/legacy-assets/...` (copied into `public/`); 1 discount; 4 sample orders + items spanning payment/fulfillment statuses; populated `homepage_settings` + `site_settings` from the static site's current copy.
- [ ] Copy `legacy/assets/*` into `public/products/*` for image URLs to resolve in the new app.
- [ ] Commit: "Add seed data and product images".

## Task 6: Supabase client layer + generated types

**Files:** `lib/supabase/{client,server,admin,middleware}.ts`, `lib/types/database.ts`, `middleware.ts`

- [ ] Browser client (`client.ts`), server client w/ cookies (`server.ts`), service-role client (`admin.ts`, server-only), session-refresh helper (`middleware.ts`).
- [ ] Root `middleware.ts`: refresh session on all routes; for `/admin/*` redirect unauthenticated → `/auth/signin`.
- [ ] Generate `lib/types/database.ts` (`supabase gen types typescript`); add `Tables<>` helper aliases in `lib/types/db.ts`.
- [ ] Commit: "Add Supabase clients, middleware, and generated types".

## Task 7: Auth — Google OAuth flow + guards

**Files:** `app/auth/signin/page.tsx`, `app/auth/callback/route.ts`, `app/auth/signout/route.ts`, `lib/auth/guards.ts`

- [ ] `signin` page: "Continue with Google" → `supabase.auth.signInWithOAuth({ provider:'google', redirectTo:/auth/callback })`.
- [ ] `callback` route: exchange code for session, redirect to `/admin`.
- [ ] `lib/auth/guards.ts`: `getCurrentUser()` (returns user + role) and `requireAdmin()` (redirects non-admins to `/`). Used by admin layout, server actions, and API routes.
- [ ] Commit: "Add Google OAuth sign-in, callback, and auth guards".

## Task 8: Protected `/admin` shell (layout + sidebar nav)

**Files:** `app/admin/layout.tsx`, `components/admin/{sidebar,topbar,nav-items}.tsx`, `app/admin/loading.tsx`, `app/admin/error.tsx`

- [ ] `layout.tsx`: `await requireAdmin()`; render sidebar (Dashboard, Products, Categories, Orders, Discounts, Homepage, Analytics, Settings) + topbar (user avatar, sign out).
- [ ] Loading skeleton + error boundary.
- [ ] Commit: "Add protected admin shell with sidebar".

## Task 9: Data-access layer for dashboard

**Files:** `lib/db/dashboard.ts`, `lib/db/products.ts`, `lib/db/orders.ts`, `tests/lib/db/dashboard.test.ts`

- [ ] `getDashboardStats()`: total products, total orders, revenue (sum total where paid), recent orders, low-inventory products (`inventory < threshold`). Typed return.
- [ ] Vitest unit test against a mocked Supabase client verifying shape and the revenue/low-stock logic.
- [ ] Commit: "Add dashboard data-access layer with tests".

## Task 10: Dashboard page + reusable components

**Files:** `app/admin/page.tsx`, `components/admin/{stat-card,data-table,low-stock-list}.tsx`

- [ ] `StatCard` (label, value, icon), `DataTable` (generic columns + rows, empty state), `LowStockList`.
- [ ] Dashboard server component renders stat cards (products/orders/revenue), recent-orders `DataTable`, low-inventory alerts. Suspense loading states.
- [ ] Commit: "Add Dashboard page and reusable admin components".

## Task 11: Module page stubs

**Files:** `app/admin/{products,categories,orders,discounts,homepage,analytics,settings}/page.tsx`, `components/admin/coming-soon.tsx`

- [ ] Each stub renders a `ComingSoon` panel naming the phase it lands in, inside the working shell. All are admin-guarded by the layout.
- [ ] Commit: "Add admin module page stubs".

## Task 12: Protected API example + error handling conventions

**Files:** `app/api/health/route.ts`, `lib/http.ts`

- [ ] `lib/http.ts`: `jsonError`, `requireAdminApi()` (401/403). `/api/health` returns counts only for admins, demonstrating endpoint protection.
- [ ] Commit: "Add protected API route and HTTP helpers".

## Task 13: Tests — e2e auth guard + validation units

**Files:** `playwright.config.ts`, `tests/e2e/admin-guard.spec.ts`, `lib/validation/*.ts`, `tests/lib/validation/*.test.ts`, `vitest.config.ts`

- [ ] Vitest config + zod schemas for the entities (used by later CRUD phases) with unit tests.
- [ ] Playwright test: anonymous visit to `/admin` redirects to `/auth/signin`; (documented manual step for the admin-role happy path since it needs Google).
- [ ] Commit: "Add validation schemas and auth-guard e2e test".

## Task 14: Documentation — setup, deploy, seed

**Files:** `README.md`, `docs/SETUP.md`, `docs/DEPLOYMENT.md`

- [ ] `docs/SETUP.md`: create Supabase project, get keys, configure Google OAuth (Cloud console → client ID/secret → Supabase Auth provider + redirect URLs), run migrations + seed (cloud and local `supabase start`), promote owner to admin, run dev.
- [ ] `docs/DEPLOYMENT.md`: Vercel deploy, env vars, Supabase production config, post-deploy admin bootstrap.
- [ ] Rewrite root `README.md` for the new app; note `legacy/` is the live site until Phase 3.
- [ ] Commit: "Add setup and deployment documentation".

## Self-Review notes

- Spec coverage: schema (T3), migrations (T3/T4), Supabase setup (T3/T6/T14), auth (T6/T7/T8), admin UI shell + dashboard (T8/T10/T11), protected routes (T6/T8/T12), seed (T5), deploy docs (T14). CRUD/upload/homepage/orders/discounts/analytics are explicitly Phases 2–6.
- No external pushes. Image upload UI is Phase 2; Phase 1 seeds images from static assets.
