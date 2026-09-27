# StallOrder — QR roadside fast-food ordering

Mobile-first web app for momos stalls, juice shops, tea shops, and similar roadside businesses.

Customers scan a QR (or open a shop URL), browse the menu, add items, enter **name + mobile**, then:

1. **Order & pay at shop (cash)** — order is `NEW`, payment `PENDING`, method `CASH`
2. **Pay online (Razorpay)** — order is confirmed for the kitchen only after **server-side verification** (checkout signature and/or webhook)

Shop owners sign in at `/admin`. Customers never create an account. There is no table management.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: PostgreSQL, Auth, Realtime, Storage
- Razorpay (swap later via `src/lib/payments`)

## Setup

1. Create a [Supabase](https://supabase.com) project.
2. In the SQL editor, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env.local` and fill in keys.
4. In Razorpay, create a webhook pointing to:

   `https://your-domain.com/api/payments/razorpay/webhook`

   Subscribe to `payment.captured` and `payment.failed`. Use the webhook secret in `RAZORPAY_WEBHOOK_SECRET`.

5. Install and run:

```bash
npm install
npm run dev
```

6. Open `/admin/login`, create a shop-owner account, then create your shop (example slug: `mallangs-momos`).
7. Add categories and products. Print the QR from **Admin → QR code**.

Customer URL:

```text
https://your-domain.com/shop/mallangs-momos
```

## Order states

Food: `NEW` → `PREPARING` → `READY` → `COMPLETED` (or `CANCELLED`)

Payment method: `CASH` | `ONLINE`

Payment status: `PENDING` | `PAID` | `FAILED`

- Cash orders appear on the admin board immediately with **payment pending**. Use **Mark payment received** after collecting cash.
- Online orders appear on the kitchen board only after Razorpay verification marks them **PAID**. Failed/cancelled checkouts never mark the order paid.

Completed orders stay in the database for history; they drop off the customer’s active-order view.

## Security notes

- Cart prices are recomputed on the server from current product rows.
- Unavailable products and closed shops are rejected at checkout.
- Duplicate cash submits are guarded with an idempotency key.
- Payment webhooks are signature-checked and idempotent (`provider_event_id`).
- Never trust the Razorpay browser success callback alone — `/api/payments/razorpay/verify` checks the HMAC.

## Deploy

Any Node host that can run Next.js (Vercel is straightforward). Set the same env vars, and set `NEXT_PUBLIC_APP_URL` to the public origin.
# Fastfoodshop
