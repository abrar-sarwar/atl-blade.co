# Deployment Guide

Target: **Vercel** (Next.js) + **hosted Supabase** (Postgres/Auth/Storage).

## 1. Provision Supabase (production)

Follow `docs/SETUP.md` → "Option B" to create the project, push migrations, and
configure the Google provider. Do **not** seed demo data into production unless
you want the sample catalog; instead add real products via the admin UI once
it's live, or run a trimmed seed.

Note your production values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret)

## 2. Deploy to Vercel

1. Push this branch to GitHub and import the repo at https://vercel.com/new
   (framework auto-detected as Next.js).
2. Add **Environment Variables** (Production + Preview):

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (mark as **sensitive**) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |
   | `ADMIN_EMAILS` | comma-separated owner emails |

3. Deploy.

## 3. Wire OAuth redirects to the deployed URL

- **Google Cloud Console** → add the Supabase callback
  `https://<ref>.supabase.co/auth/v1/callback` (already added if done in setup).
- **Supabase → Authentication → URL Configuration**:
  - Site URL: `https://your-domain.com`
  - Redirect allow-list: add `https://your-domain.com/auth/callback`

`NEXT_PUBLIC_SITE_URL` must match the deployed origin so the OAuth `redirectTo`
resolves correctly.

## 4. Bootstrap the first admin

After the owner logs in once via Google on production, promote them (Supabase
SQL editor):

```sql
select public.make_admin('owner@atlbladeco.com');
```

(Or pre-seed `public.admin_emails` so they're admin on first login.)

## 5. The legacy storefront

`legacy/` is excluded from the Next.js build (`outputFileTracingExcludes`). It
remains the live customer storefront until the Phase 2–3 migration replaces it.
Keep serving it from its current host until those phases land, then point the
domain at the Next.js app.

## 6. Post-deploy checklist

- [ ] `GET /` returns 200.
- [ ] `GET /admin` while signed out → redirects to `/auth/signin`.
- [ ] `GET /api/health` while signed out → 401.
- [ ] Owner can sign in with Google and reach `/admin` (admin role applied).
- [ ] A non-owner Google account is redirected from `/admin` to `/`.
- [ ] Dashboard figures render (will be zeros until real products/orders exist).

## Schema changes after launch

Add a new migration under `supabase/migrations/`, then:

```bash
npx supabase db push
npx supabase gen types typescript --project-id <ref> > lib/types/database.ts
```

Commit the regenerated types and redeploy.
