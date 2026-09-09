# People Plus Network

A simple, transparent product + referral platform. React/Vite/Tailwind frontend,
Supabase (Postgres + Auth + Storage) backend, Vercel serverless functions for
anything that touches money.

## What's in this build (Phase 1)

This is a real, working foundation — not a mockup. It's scoped down from the
full spec so that everything included actually works end-to-end, rather than
being padded with stubs.

**Done:**
- Full Supabase schema, RLS policies, and storage buckets (`supabase/migrations/`)
- The money-critical logic as Postgres functions, callable only server-side:
  wallet ledger (`record_transaction`), order → paid → referral commission
  (`mark_order_paid`), refund reversal (`reverse_order`), withdrawal request +
  admin approval (`request_withdrawal`, `admin_update_withdrawal`), referral
  attribution (`register_referral`)
- Public site: home, products, product detail, how it works, FAQ, contact,
  terms, privacy, refund policy
- Auth: register (with referral code capture from `?ref=`), login, forgot
  password, protected routes
- User dashboard: overview, products, checkout (creates a pending order —
  never fakes a paid one), wallet, withdraw, referrals, income history,
  profile, support tickets, notifications
- Example Vercel API routes showing the required pattern: a payment webhook
  handler and an admin withdrawal-update handler, both using the service
  role key and re-checking authorization server-side

**Not yet built (Phase 2 — say the word and I'll build these next):**
- Admin panel UI (`/admin/*`) — the SQL functions and RLS it needs already
  exist (`admin_update_withdrawal`, `is_admin()`, `admin_users` table), so
  this is mostly frontend + a handful of API routes
- Actual payment gateway integration (Razorpay/Stripe/etc.) — the webhook
  handler is a template; you need to add your gateway's SDK and signature
  verification
- EmailJS welcome-email trigger on signup, and admin announcement → email
- Events/reward system UI (tables already exist)
- Product image upload flow for admins

## Project structure

```
frontend/     React app (Vite + Tailwind + React Router)
api/          Vercel serverless functions (payments, withdrawals, etc.)
supabase/
  migrations/ SQL migrations — run these in order
  seed.sql    Sample products for local development
```

## 1. Supabase setup

1. Create a project at supabase.com.
2. In the SQL editor, run the migrations in `supabase/migrations/` **in
   order** (0001 → 0004).
3. Optionally run `supabase/seed.sql` to get 3 sample products.
4. Under Project Settings → API, copy your Project URL, anon key, and
   service role key.
5. To make yourself an admin: after registering a normal account, run in the
   SQL editor:
   ```sql
   insert into public.admin_users (id) values ('<your-user-uuid>');
   ```

## 2. Frontend setup

```bash
cd frontend
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## 3. EmailJS setup (for the Contact page)

1. Create an account at emailjs.com, add an email service, and create a
   template with variables `from_name`, `from_email`, `message`.
2. Copy the Service ID, Template ID, and Public Key into `.env` as
   `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_CONTACT_TEMPLATE_ID`,
   `VITE_EMAILJS_PUBLIC_KEY`.

## 4. Vercel deployment

1. Push this repo to GitHub.
2. Import it into Vercel. Set the root directory build settings so the
   frontend builds from `frontend/` (Framework preset: Vite) and `api/`
   deploys as serverless functions.
3. In Vercel → Project → Settings → Environment Variables, add every value
   from `.env.example`, including the **private** ones
   (`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`) — set these as server-only,
   never with a `VITE_` prefix.
4. Deploy.

## Security notes (please read before going live)

- `SUPABASE_SERVICE_ROLE_KEY` must only ever be set as a Vercel environment
  variable used inside `api/*.js`. It is never referenced from `frontend/`.
- The frontend never writes to `transactions`, never flips an order to
  `paid`, and never approves a withdrawal — RLS blocks all of that. Those
  actions only happen through the Postgres functions in
  `0003_functions.sql`, called either by a verified webhook or an
  authenticated admin API route.
- Before launch, get `/terms`, `/privacy`, and `/refund-policy` reviewed by
  a qualified lawyer — the current copy is placeholder structure, not legal
  advice, and contains `[bracketed]` fields you need to fill in.
- Wire up real payment gateway signature verification in
  `api/payments/webhook.js` before accepting real payments; right now it's a
  template that shows the required shape but doesn't verify anything.
