# ATL Blade Co. — Storefront + Admin Platform

Handmade knives out of Atlanta, run by Zian Bhutta. This repo is migrating the
business from a hardcoded static site to a database-driven Next.js app with an
admin dashboard, so all content and operations are managed without touching
source code.

## Status

| Area | State |
|------|-------|
| **Admin dashboard** (`/admin`) | ✅ Phase 1 — auth, shell, dashboard live |
| Database (Supabase/Postgres) | ✅ Full schema, RLS, seed |
| Customer storefront | 🚧 still the static site in `legacy/` (ports in Phases 2–3) |

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the full design
and phased roadmap.

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase
(Postgres + Auth + Storage) · Google OAuth · zod · Vitest · Playwright.

## Quick start

```bash
npm install
npx supabase start        # local Postgres/Auth in Docker
npx supabase db reset     # apply migrations + seed
cp .env.example .env.local # fill in keys from `npx supabase status`
npm run dev               # http://localhost:3000/admin
```

Full instructions (including Google OAuth and hosted Supabase) are in
[`docs/SETUP.md`](docs/SETUP.md). Production deployment is in
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Architecture

```
app/
  admin/            Protected admin dashboard (role-gated in layout)
  api/              Route handlers (admin-protected)
  auth/             Google OAuth sign-in / callback / sign-out
lib/
  supabase/         Browser, server, service-role clients + session middleware
  db/               Typed data-access layer (queries return domain objects)
  validation/       zod schemas (shared server + client)
  auth/             getCurrentUser / requireAdmin guards
  types/            Generated DB types + aliases
components/
  ui/               shadcn primitives
  admin/            Reusable admin components (Sidebar, StatCard, …)
supabase/
  migrations/       SQL schema, RLS, grants
  seed.sql          Seed data (real catalog + sample orders)
legacy/             The original static storefront (still live until Phase 3)
```

Request flow for mutations: **UI → Server Action → zod validation →
`lib/db` → Supabase**, with `requireAdmin()` enforced server-side and RLS
enforced at the database (defense in depth).

## Admin modules

Dashboard (live) · Products · Categories · Orders · Discounts · Homepage Editor
· Analytics · Settings. Modules beyond the Dashboard are scaffolded as
placeholders and built out in Phases 2–6 (see the roadmap spec).

## Tests

```bash
npm test          # Vitest unit tests (validation, dashboard logic, utils)
npm run test:e2e  # Playwright e2e (admin route protection)
```

## License

Private project for ATL Blade Co.
