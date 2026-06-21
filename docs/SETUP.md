# Setup Guide — ATL Blade Co. Admin Platform

This is a Next.js (App Router) app with a Supabase (Postgres + Auth) backend.
The customer-facing storefront still lives in `legacy/` and is being migrated
to Next.js phase by phase. This guide gets the **admin dashboard** running.

## Prerequisites

- Node.js 20+ and npm
- Docker (for local Supabase) — Docker Desktop or Colima
- A Google account (for OAuth) and, for cloud, a Supabase account

---

## Option A — Run fully locally (recommended for development)

### 1. Install dependencies

```bash
npm install
```

### 2. Start local Supabase

```bash
npx supabase start
```

This boots Postgres, Auth, Storage, and Studio in Docker. It prints your local
keys. (If ports clash with another Supabase project, the ports in
`supabase/config.toml` have been moved to the `544xx` range for this project.)

> Using **Colima** instead of Docker Desktop? The analytics container is
> disabled in `supabase/config.toml` (`[analytics] enabled = false`) because it
> can't mount the Docker socket under Colima.

### 3. Apply schema + seed

```bash
npx supabase db reset
```

This runs every migration in `supabase/migrations/` then loads
`supabase/seed.sql` (real 7-knife catalog, sample orders, settings).

### 4. Configure environment

Copy the example and fill in the local keys printed by `supabase start`
(re-print anytime with `npx supabase status`):

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from supabase status>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=you@example.com
```

### 5. Enable Google OAuth locally (optional but needed to actually log in)

1. Create OAuth credentials in Google Cloud Console (see "Google OAuth" below).
2. In `supabase/config.toml`, set `[auth.external.google] enabled = true`.
3. Export the secrets before `supabase start`:
   ```bash
   export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=...
   export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=...
   npx supabase stop && npx supabase start
   ```
   Use this authorized redirect URI in Google:
   `http://127.0.0.1:54421/auth/v1/callback`

### 6. Run the app

```bash
npm run dev
```

Open http://localhost:3000/admin → you'll be redirected to sign in with Google.

---

## Option B — Hosted Supabase project

### 1. Create the project

1. Go to https://supabase.com/dashboard → **New project**. Save the database
   password.
2. In **Project Settings → API**, copy the **Project URL**, **anon** key, and
   **service_role** key.

### 2. Link and push migrations

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push          # applies supabase/migrations/*
```

Then load seed data (optional, for demo/testing) via the SQL editor — paste
`supabase/seed.sql` — or:

```bash
psql "$(npx supabase db url)" -f supabase/seed.sql
```

### 3. Configure Google OAuth (hosted)

In the Supabase dashboard → **Authentication → Providers → Google**, enable it
and paste your Google **Client ID** and **Client secret**. Set the redirect URL
in Google to:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Under **Authentication → URL Configuration**, set the Site URL and add
`http://localhost:3000/auth/callback` and your production callback to the
allow-list.

### 4. Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=you@example.com
```

After changing the schema on hosted, regenerate types:

```bash
npx supabase gen types typescript --project-id <ref> > lib/types/database.ts
```

---

## Google OAuth credentials (one-time)

1. Google Cloud Console → **APIs & Services → Credentials → Create credentials →
   OAuth client ID**.
2. Application type: **Web application**.
3. **Authorized redirect URIs**: add the Supabase callback URL for your
   environment (local: `http://127.0.0.1:54421/auth/v1/callback`; hosted:
   `https://<ref>.supabase.co/auth/v1/callback`).
4. Copy the **Client ID** and **Client secret** into Supabase (config.toml env
   vars locally, or the dashboard provider settings for hosted).

---

## Two-factor authentication (required for admins)

Admin sign-in supports **email + password** and **Google OAuth**, and every
admin must complete **TOTP 2FA** before reaching `/admin` (enforced at AAL2 in
the route guard and admin API):

- First login → redirected to `/auth/setup-2fa`: scan the QR with Google
  Authenticator / Authy / 1Password, enter the 6-digit code to enroll.
- Later logins → redirected to `/auth/2fa`: enter the current 6-digit code.

Supabase manages this natively: passwords are bcrypt-hashed, TOTP secrets are
stored encrypted in `auth.mfa_factors`, the session JWT carries the `aal` claim,
and auth endpoints are rate-limited. Enable TOTP locally with
`[auth.mfa.totp] enroll_enabled = true` + `verify_enabled = true` in
`supabase/config.toml` (already set). In hosted Supabase, enable MFA under
Authentication → settings.

To create a password admin for local testing:

```bash
# create a confirmed user, then promote (see scripts in docs or run via Studio)
curl -s -X POST "http://127.0.0.1:54421/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"a-strong-password","email_confirm":true}'
# then in SQL: select public.make_admin('you@example.com');
```

## Becoming an admin

Authorization is driven by `public.users.role`. There are two ways in:

- **Allow-list (automatic):** any email in the `public.admin_emails` table (or
  the `ADMIN_EMAILS` seed) is promoted to `admin` automatically on first login.
  Edit the list in `supabase/seed.sql` before seeding, or insert rows later.
- **Manual promotion:** after a user has logged in once, run in the SQL editor:
  ```sql
  select public.make_admin('you@example.com');
  ```

Non-admins who reach `/admin` are redirected to the homepage.

---

## Stripe (Phase 4 checkout)

Hosted Stripe Checkout. The app creates a pending order, redirects to Stripe,
and a webhook finalizes the order (marks paid, decrements inventory, bumps
discount usage). Without keys the storefront still runs; checkout returns a
"not configured" message.

1. In the [Stripe dashboard](https://dashboard.stripe.com) (test mode), copy
   the **Secret key** (`sk_test_...`) into `STRIPE_SECRET_KEY`.
2. Forward webhooks locally with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the printed signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
3. Set `NEXT_PUBLIC_SITE_URL` to your origin (e.g. `http://localhost:3000`) so
   success/cancel redirects and product image URLs resolve.
4. Test card: `4242 4242 4242 4242`, any future expiry/CVC.

In production, create a webhook endpoint in the dashboard pointing at
`https://your-domain.com/api/webhooks/stripe` (event
`checkout.session.completed`) and use its signing secret.

The order-finalize logic (`mark_order_paid`) is idempotent — redelivered
webhooks never double-decrement inventory.

## Common commands

```bash
npm run dev          # start the Next.js app
npm run build        # production build
npm test             # unit tests (Vitest)
npm run test:e2e     # e2e tests (Playwright) — boots the dev server
npm run db:reset     # re-apply migrations + seed (local)
npm run db:types     # regenerate TS types from the local DB
npm run legacy       # serve the old static storefront from legacy/
```

## Troubleshooting

- **"permission denied for table ..."** from the API → the table GRANTs in
  `0003_grants.sql` didn't apply. Re-run `npx supabase db reset`.
- **Query results typed as `never`** → `@supabase/ssr` and `@supabase/supabase-js`
  versions drifted apart. Keep them on compatible majors (this project uses
  `@supabase/ssr@^0.12`).
- **`supabase start` fails on Colima** with a docker.sock mount error → ensure
  `[analytics] enabled = false` in `supabase/config.toml`.
