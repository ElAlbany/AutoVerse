# AutoVerse platform upgrade

Implemented 31 October 2026 in the existing Next.js application. No hosted deployment was published.

## What changed

- New ivory/pine and graphite/sage design, editorial homepage, compact date search, persistent card actions, responsive catalogue, practical rental guide, real empty review states, and consistent navigation.
- Public catalogue, vehicle pages, comparisons, quotes and availability. Booking, saving, reviewing, reporting and VERO require authentication. Booking dates survive the sign-in return URL. Protected server mutations independently check ownership or administrator role.
- Physical `VehicleUnit` inventory behind each public `Car` listing. Maintenance and bookings share `VehicleReservation`. A PostgreSQL exclusion constraint rejects overlapping active reservations for the same unit. Per-listing row locks serialize allocation, cancellation, maintenance, reassignment, and staff status changes across server instances.
- Exact server-side daily pricing, future/range validation, a 90-day online limit, half-open schedule intervals, and a 60-minute preparation buffer. Prices, vehicle names, currency and policy are stored with each booking. Retrying the same request does not create another booking.
- Two explicit paths: a 24-hour staff-reviewed booking request when Stripe is absent, or sandbox Checkout with expiring inventory holds. A verified payment confirms the rental only if the hold remains valid. Late payments enter the refund queue.
- Signed Stripe webhooks, event deduplication, stable Checkout/refund idempotency keys, cancellation/refund states and a resumable checkout link. Live Stripe keys and events are rejected.
- Staff fleet timeline and schedule, physical unit management, maintenance blocks, legacy conflict reconciliation, archive instead of destructive car deletion, and staff-recorded collection/return. Overdue active vehicles are excluded from new allocation until staff record a return.
- Completed-rental reviews, 1–5 rating validation, one review per booking, a 14-day editing window, averages/counts, reports and moderation reasons. Unreviewed cars never receive fabricated ratings.
- Account favorites, browser-local three-car comparison, reliable cancellation feedback and rental activity history.
- Persistent rate limiting for booking, reviews, availability and chat; bounded chat input; seat-aware and date-aware inventory for VERO; provider failures do not expose raw errors or credentials.
- A durable notification outbox with claims, retries and provider idempotency. Booking success does not depend on immediate email delivery. Collected revenue counts paid bookings rather than all requests.

## Existing development data

The user confirmed that the configured database is a development database and authorized migration. The migration preserved 49 listings and all 16 orders, created one initial physical unit per listing, and detected two conflicting legacy orders on one listing. That listing was closed to new reservations and those orders were flagged for staff reconciliation. No stock was invented and no customer order was deleted or automatically cancelled to resolve the conflict.

In **Admin → Fleet calendar**, add only audited physical inventory and assign vehicles to the flagged orders. Then enable the listing in Cars. Initial fleet codes are internal migration identifiers; staff can add their actual fleet units. Seat/luggage capacity remains unverified until explicitly entered in the vehicle editor.

## Local setup

1. Install with `npm ci` and configure the values shown in `.env.example` in ignored environment files.
2. Use a development database first. Run `npx prisma migrate deploy`, then `npx prisma generate`.
3. Start with `npm run dev`. For a production preview use `npm run build` and `npm start`.
4. Clerk remains the authentication provider. `lib/auth.ts` is the application boundary for current-user and admin access. Staff roles come from the server database, never a client request.
5. For payments, supply Stripe **test** keys and a webhook signing secret. Forward Checkout events to `/api/stripe/webhook`; subscribe to `checkout.session.completed`, `checkout.session.expired` and `checkout.session.async_payment_succeeded`. This edition accepts card methods only. Do not enter real cards.
6. Set an exact `APP_URL`; production requires HTTPS. The server constructs Checkout return URLs from this trusted setting, not the incoming Host header.
7. Configure a scheduler to call `GET /api/maintenance` every five minutes with `Authorization: Bearer <CRON_SECRET>`. Use a long, randomly generated secret. This releases expired holds, retries queued notifications and refunds, and clears stale rate-limit rows. Local allocation also releases expired holds before checking stock.
8. Configure Resend and an approved sending domain through `EMAIL_FROM`. Outbox jobs remain queued if email is unavailable. Staff-recorded completion emails invite the customer to leave a verified review.

Stripe credentials and an external scheduler were not present during implementation. The manual request path is available without them. No real payment was attempted and no Stripe account was created on the user's behalf.

## Company deployment

This is a single-operator application with many customer accounts and shared fleet inventory. Selling a separate deployment to a company is supported by the architecture. A shared multi-company SaaS would additionally require tenant IDs on every owned resource, tenant-scoped authorization, separate configuration/payment accounts, and isolation tests; do not use a global admin role as tenant isolation.

- Use pooled PostgreSQL connections for app traffic and a direct migration connection. Set connection limits for the number of application instances. Back up the database and rehearse restores.
- Run migrations as a release step. Do not reset or reseed an operating company's database.
- Use production Clerk credentials and the company's account/domain. Configure account recovery, MFA for staff and staff lifecycle procedures with the identity provider.
- Configure trusted proxy/IP headers at the hosting edge for rate limiting. Do not trust arbitrary public forwarding headers in a self-hosted reverse proxy.
- Add monitoring for failed webhooks, long-lived `REFUND_PENDING`, failed email attempts, unresolved legacy assignments and late vehicle returns. Load-test the expected booking traffic against a staging environment before committing to capacity targets.
- Replace operational placeholders with company-specific pickup locations, licensed fleet photography, verified capacities, fuel/mileage/deposit terms, protection arrangements, support details, tax treatment and legal/privacy policies.
- Image URLs are entered by staff. HTTPS images are optimized by Next.js with local IP access disabled and limited redirects. Configure an explicit image-host allowlist for the company's storage provider before deployment.
- Customer and staff access must continue to be checked on every server action and API route. Public browsing must remain possible without an account.
- Going live with real payments is a separate release: remove the explicit sandbox-only guard only after real payment/refund policies, identity checks, taxes and operational readiness are reviewed and tested.

## Rendering strategy

- **RSC + request rendering:** the home catalogue, featured collection, vehicle details, booking, account and admin pages query the current database on the server. Dynamic request data and explicit dynamic rendering prevent build-time stock/rate snapshots. Prices and inventory are always rechecked at mutation time.
- **CSR where needed:** theme preference, mobile navigation, date inputs, live quote feedback, favorites, comparison, review forms and staff action forms are client components. Business authority stays on the server.
- **Static generation:** the rental guide, privacy overview, how-it-works page and comparison shell are generated statically; the comparison data itself is browser-local. These pages change with code releases.
- **ISR:** deliberately not used for bookable stock, checkout quotes, customer data or payment state. A future editorial journal or destination guide can use time-based ISR once it has independently changing content. Adding a revalidation interval to unchanged static copy would add no value.
- **GSSP/GSS:** this is the App Router, so Pages Router APIs such as `getServerSideProps` and `getStaticProps` are not mixed in. Their request-rendered and build-rendered roles are handled by Server Components and the route's rendering settings.

## Authentication decision

Clerk was retained. Replacing a working provider with custom JWT handling would add password recovery, rotation, session revocation, MFA, account security and operational responsibilities without solving fleet concurrency. The application-level auth boundary keeps business rules independent of Clerk's UI. A company can later choose a maintained self-hosted authentication library when its cost, hosting, compliance or identity-provider requirements justify migration; existing user IDs and rental ownership must be preserved.

## Verification

- TypeScript checking and production build.
- Rental-policy tests: exact-cent pricing, partial rental days, invalid/past/reversed/overlong dates, exact cancellation cutoff, preparation buffer and safe sign-in redirects.
- Development-database integration tests: concurrent one/two-unit allocation, direct database overlap rejection, turnaround boundaries, fragmented availability, signed webhook rejection, exact payment totals, and event replay safety. Payment fixtures do not call Stripe APIs or send emails. Test fixtures use isolated random IDs and clean up only their own records.
- Browser QA covers public desktop/mobile layouts, both themes, guest availability searches and comparison. Authenticated staff/customer sessions and live Stripe webhook delivery require the corresponding configured accounts and are not claimed as end-to-end verified.
- Dependency audit after compatible updates and the Prisma config transitive dependency override: zero known vulnerabilities at implementation time. The project remains on Prisma 6; no unrequested major ORM migration was performed.

Run `npm test`. Run `npm run test:inventory` with `RUN_DB_TESTS=1` only against an authorized development database. `.env` provides that integration test's connection.

## Further product work

The original growth ideas remain a roadmap, not claims about functionality already delivered: extension/rescheduling workflows with additional payment collection, pickup/return photographic inspections, full date-range calendar widgets, recently viewed vehicles, weekly/monthly tariffs, promotions, delivery, additional drivers/child seats, loyalty, localization, business accounts and tenant isolation. Rental changes currently go through staff; the system must not imply an extension has been approved. These depend on the operator's actual rules and need their own acceptance tests.

## Image provenance

The homepage editorial photograph is by Dave Pullis, downloaded from https://unsplash.com/photos/black-porsche-911-parked-in-a-parking-lot-_BdlUN_3YiY under the Unsplash license (https://unsplash.com/license). The source page's description identifies the vehicle as a Mercedes GT. It is an editorial scene, not evidence that this exact vehicle is in the rental fleet. Listing placeholders are original SVG illustrations, explicitly labeled. Watermarked Imagin demo images are not displayed as approved fleet photographs.

## Preview artifacts and final checks

- [Desktop light theme](screenshots/home-light.jpg)
- [Desktop dark theme](screenshots/home-dark.jpg)
- [Mobile booking, dark theme](screenshots/booking-mobile-dark.jpg)
- [Mobile booking, light theme](screenshots/booking-mobile-light.jpg)

The browser verified a guest search, three-day server quote, comparison without login, sign-in at the booking action, and a protected favorites redirect preserving the destination. At a 390 × 844 mobile viewport, both home and booking layouts had content width equal to viewport width. Desktop and mobile themes were inspected visually.

The test suite passed five policy/redirect tests and three database/payment integration tests. HTTP smoke checks rejected anonymous chat and scheduled-job calls (401) and an unsigned Stripe webhook (400). The production build completed with the catalogue, featured collection, details, booking and private pages rendered dynamically, and the guide pages statically generated.

Post-test counts remained 49 listings, 49 initial vehicle units and 16 original orders, with two legacy orders flagged for reconciliation. No integration fixtures remained and no email or payment API was invoked by these tests.

Development work is tracked in feature commits on `codex/rental-platform-upgrade`; each checkpoint is pushed to the repository. The main branch has not been merged or deployed by this task.
