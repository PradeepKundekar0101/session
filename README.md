# GetMentor — Session MVP

A lean two-sided marketplace: learners book and pay for 1-on-1 video sessions with vetted mentors. The MVP validates the full loop — **availability → request → authorize payment → mentor approve → capture → video session → payout**.

## Stack

| Layer | Service |
|-------|---------|
| App | Next.js 16 (App Router), TypeScript, Tailwind |
| Auth & DB | Supabase (Postgres + RLS) |
| Payments | Stripe Connect Express (manual capture) |
| Video | Daily.co |
| Email | Resend |

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migration in `supabase/migrations/20260529000000_initial_schema.sql` via the SQL editor (or `supabase db push` if using the CLI).
3. Enable Email auth (password) under Authentication → Providers.
4. Under **Authentication → URL configuration**, set Site URL and add redirect URLs:
   - `http://localhost:3003` (or your dev port)
   - `http://localhost:3003/auth/callback`
5. Copy **Project URL** (base URL only, not `/rest/v1/`), **anon key**, and **service role key**.

**Email verification:** Users stay signed in after signup. If email is not confirmed, they are sent to `/verify-email` until they click the link in their inbox. For local dev, either confirm via the email link or temporarily disable **Confirm email** under Authentication → Providers → Email (production should keep it on).

**First admin user:** after signing up, run in SQL:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

### 2. Stripe

1. Create a [Stripe](https://stripe.com) account (test mode is fine).
2. Enable **Connect** → Express accounts.
3. Add keys to `.env` and create a webhook endpoint (optional for MVP) pointing to `/api/stripe/webhook` for `payment_intent.*` events.
4. Set `PLATFORM_FEE_PERCENT` (default `10`).

### 3. Daily.co

1. Create an account at [daily.co](https://daily.co).
2. Add `DAILY_API_KEY` to `.env`.

### 4. Resend

1. Create an API key at [resend.com](https://resend.com).
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (use their sandbox domain for testing).

### 5. Environment

```bash
cp .env.example .env.local
# fill in all values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Core flows

### Mentor

1. Sign up → **Apply as mentor** → complete `/dashboard/mentor/onboarding`.
2. Connect Stripe Express from the onboarding page.
3. Set weekly availability at `/dashboard/mentor/availability`.
4. Wait for admin approval → public profile at `/mentors/[slug]`.
5. Approve or deny requests from the mentor dashboard (capture releases hold on deny).

### Learner

1. Browse `/mentors` → pick a slot → booking created.
2. On `/bookings/[id]`, **authorize** card hold (Stripe Payment Element).
3. After mentor approves, join the Daily room (opens 15 min before start).

### Admin

- `/dashboard/admin` — approve mentors, view bookings and Stripe balance summary.

### Expiring requests

- Unapproved bookings past `APPROVAL_WINDOW_HOURS` (default 24h) are expired by `/api/cron/expire-bookings`.
- On Vercel, `vercel.json` runs this hourly; set `CRON_SECRET` and send `Authorization: Bearer <CRON_SECRET>`.

## PRD defaults (open questions resolved)

| Question | MVP default |
|----------|-------------|
| Approval window | 24 hours, then auto-expire (no auto-approve) |
| Platform fee | `PLATFORM_FEE_PERCENT` env (10%) via Stripe `application_fee_amount` |
| Video | Daily.co embedded link |
| Post-approval cancellation | Out of scope — policy copy only |

## Project structure

```
app/                  # Routes (marketing, auth, mentors, bookings, dashboard)
lib/                  # Supabase, Stripe, Daily, email, slots, booking logic
supabase/migrations/  # Schema + RLS
components/           # UI primitives + Stripe payment form
```

## Deploy (Vercel)

1. Import repo, add all env vars from `.env.example`.
2. Set `NEXT_PUBLIC_APP_URL` to your production URL.
3. Configure Stripe webhook + Connect redirect URLs for production.
4. Add Vercel cron auth header for expire-bookings (or use Vercel Cron with `CRON_SECRET`).

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run lint     # ESLint
```
