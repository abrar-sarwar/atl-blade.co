# Deploy Checklist — ATL Blade Co. (Vercel)

A step-by-step for taking the app live on Vercel. Secret values are **not** in
this file — copy them from your local `.env.local` when prompted.

Project facts you'll reuse:
- **Supabase URL:** `https://rxrkkvrynpmmnalbmxrv.supabase.co`
- **GitHub branch:** `feat/admin-dashboard` (already pushed)
- **Admin emails:** `atlbladeco@gmail.com,abrartsarwar@gmail.com`

---

## 1. Create the Vercel project

Option A — Dashboard (easiest):
1. Go to https://vercel.com/new
2. Import the GitHub repo `abrar-sarwar/atl-blade.co`
3. When asked which branch to deploy, choose **`feat/admin-dashboard`**
   (or merge it to `main` first — your call)
4. Framework auto-detects as **Next.js**. Don't deploy yet — set env vars first (step 2).

Option B — CLI: run `npx vercel` in the project folder and follow prompts.

---

## 2. Set environment variables in Vercel

In the project's **Settings → Environment Variables**, add these for the
**Production** environment. Copy the secret values from your local `.env.local`.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://rxrkkvrynpmmnalbmxrv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (copy from `.env.local`) |
| `SUPABASE_SERVICE_ROLE_KEY` | (copy from `.env.local`) — mark **Sensitive** |
| `ADMIN_EMAILS` | `atlbladeco@gmail.com,abrartsarwar@gmail.com` |
| `NEXT_PUBLIC_SITE_URL` | **your Vercel URL**, e.g. `https://atl-blade-co.vercel.app` ← CHANGED from localhost |
| `STRIPE_SECRET_KEY` | (copy from `.env.local`) — mark **Sensitive** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (copy from `.env.local`) |
| `STRIPE_WEBHOOK_SECRET` | leave blank for now — filled in step 4 |

> You won't know the exact Vercel URL until the first deploy. Deploy once, note
> the URL Vercel gives you, then come back and set `NEXT_PUBLIC_SITE_URL` to it
> and redeploy. (Or set a custom domain first and use that.)

---

## 3. Deploy

Trigger the deploy (Dashboard "Deploy" button, or `npx vercel --prod`).
Wait for it to finish and note the live URL.

---

## 4. Production Stripe webhook (replaces local `stripe listen`)

The local `stripe listen` only works on your laptop. For the live site:

1. Stripe Dashboard (**Test mode** for now) → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://YOUR-VERCEL-URL/api/webhooks/stripe`
3. Events to send: **`checkout.session.completed`**
4. Create it, then click the endpoint → **Reveal** the **Signing secret** (`whsec_...`)
5. Put that into Vercel as `STRIPE_WEBHOOK_SECRET` (Settings → Env Vars) and **redeploy**

---

## 5. Point Supabase at the live URL

Supabase Dashboard → **Authentication → URL Configuration**:
- **Site URL:** your Vercel URL
- **Redirect URLs:** add `https://YOUR-VERCEL-URL/auth/callback`

(Mainly needed if you add Google login later; harmless to set now.)

---

## 6. Post-deploy smoke test

- [ ] `https://YOUR-URL/` loads the homepage with products
- [ ] `https://YOUR-URL/shop` lists the 7 knives
- [ ] `https://YOUR-URL/admin` redirects to sign-in
- [ ] Sign in (email + password), complete 2FA, reach the dashboard
- [ ] Add to cart → checkout → pay with test card `4242 4242 4242 4242`
- [ ] Order appears **paid** in `/admin/orders`, inventory dropped by 1

---

## 7. Going LIVE with real payments (when ready)

Test mode = fake cards only. To take real money:

1. **Activate the Stripe account** (the shop owner's): Stripe Dashboard →
   **Activate payments** → business details + **bank account** for payouts.
2. Switch on **Live mode** in Stripe, grab the **live** keys
   (`sk_live_...`, `pk_live_...`).
3. Create a **live** webhook endpoint (repeat step 4 in live mode) → new
   `whsec_...`.
4. In Vercel, replace the three Stripe vars with the live values → redeploy.
5. Do one real low-value purchase to confirm, then refund it in Stripe.

> Until step 1 is done by the account owner, the site can be live but only
> processes test cards.

---

## Notes

- **Real product prices:** set them in `/admin/products` (current prices are
  placeholders).
- **`legacy/` folder** is excluded from the build; it ships nothing.
- **Two admin logins exist** on the cloud DB: `admin@atlblade.dev` and
  `atlbladeco@gmail.com`. Each sets up their own 2FA on first login.
- **Your friend** can log in once the site is deployed (he can't reach
  localhost). Hand him his email + temp password; he sets his own 2FA.
