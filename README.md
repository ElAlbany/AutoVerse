# AutoVerse

A Next.js car rental application with public browsing, a considered light/dark design, physical fleet inventory, verified rental reviews, staff operations and optional Stripe sandbox checkout.

This repository is a development demonstration. Company rollout requirements and remaining product work are documented in [Platform upgrade & deployment](docs/PLATFORM_UPGRADE.md).

## Run locally

1. `npm ci`
2. Configure ignored environment files using [.env.example](.env.example).
3. Point Prisma at an authorized development PostgreSQL database.
4. `npx prisma migrate deploy`
5. `npx prisma generate`
6. `npm run dev`

Open [localhost:3000](http://localhost:3000). A production preview uses `npm run build` followed by `npm start`.

## Customer experience

- Browse, filter, compare cars and check date-specific availability without an account.
- Sign in when booking, saving a car, submitting/reporting a review, or using VERO. Selected booking dates survive the return through sign-in.
- Server-calculated quotes use started 24-hour rental periods. Each listing owns individual physical vehicle units; a booking reserves one unit for the entire trip, plus a preparation buffer.
- Without Stripe configuration, submit a booking request for staff review. Requests expire after 24 hours.
- With Stripe test credentials and webhooks configured, a temporary vehicle hold leads to sandbox Checkout. The server verifies payment before confirming the rental. Real Stripe keys and events are rejected.
- Manage rental activity, cancellation, refund status, and verified reviews from the account. Reviews are available after staff record the vehicle return.
- Save favorites to the account; compare up to three cars in the browser.

## Staff operations

Admin roles are stored in PostgreSQL and checked on server mutations. The admin panel includes cars, orders, fleet schedule, maintenance blocks, physical units, conflict reconciliation, review moderation and analytics. Cars are archived to preserve booking history. Staff explicitly record pickup and return; a calendar date never automatically marks a vehicle returned.

The upgrade migration preserved existing orders and flagged ambiguous legacy vehicle assignments. Use **Admin → Fleet calendar** to reconcile those bookings against actual stock before re-enabling an affected listing.

## Background processing

Configure a scheduler to call `GET /api/maintenance` every five minutes with `Authorization: Bearer <CRON_SECRET>`. It releases expired holds and retries durable notification/refund jobs. A scheduler is not bundled into the web server. Set `RESEND_API_KEY` and an approved `EMAIL_FROM` for delivery.

Stripe events go to `POST /api/stripe/webhook`. Local forwarding requires the Stripe CLI and the matching webhook signing secret. See the platform deployment document for event subscriptions and operational requirements.

## Verification

- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm audit`
- With `RUN_DB_TESTS=1` against an authorized development database: `npm run test:inventory`

The integration suite creates isolated random fixtures, verifies concurrent stock allocation, database overlap rejection, preparation boundaries, fragmented availability, signed webhook handling, payment amount validation and replay safety, then removes only its own fixtures. It does not charge cards or send emails.

The inherited `npm run lint` script invokes `next lint`, which Next.js 16 does not support. It is not a verification check.

## Structure

- `app/`: public/customer/admin routes, server actions and API handlers.
- `components/`: shared UI, booking controls, account and admin components.
- `lib/`: auth boundary, booking/inventory/payment services, policies, outbox and rate limiting.
- `prisma/`: schema, reviewed migrations and demo seed.
- `tests/`: rental policy and development database integration checks.
- `docs/`: implementation decisions, verification limits and company deployment requirements.

Never commit credentials. Keep real fleet photographs, capacities, collection instructions and operating policies accurate. The editorial homepage image is not a promise of a particular rental vehicle; listing illustrations are explicitly labeled until approved fleet photos are supplied.
