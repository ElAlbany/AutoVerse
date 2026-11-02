# System review — 2 November 2026

## Before merging the platform upgrade

The review covered booking allocation, branch stock, cancellation, collection/return, payment settlement, review eligibility, public browsing, comparison, chat, authentication boundaries and rendering behavior.

### Corrections

- VERO's previous Gemini model returned `404` for the configured account. The default now uses `gemini-3.5-flash-lite`; an unavailable configured model falls back once. Replies use structured output and only known inventory IDs. Timeout, quota, malformed reply and retry states are handled. Analytics failures cannot discard a valid answer. Conversations are scoped to the signed-in account; a guest's draft survives the sign-in redirect.
- Checkout creation now rechecks the locked reservation after the external gateway returns. A cancellation or expired hold cannot be revived by a late checkout response. The session is retained for webhook reconciliation, expired when possible, and late payment enters the refund queue.
- Cancellation retries are idempotent. Staff cannot collect a rental whose scheduled period has ended or complete an unassigned rental. A late return cannot consume another reservation's preparation time silently. An overdue active unit cannot be taken offline without resolving its reservations.
- Booking, review, staff status and fleet actions return readable business errors in production. Infrastructure errors are redacted. Availability responds with appropriate validation, rate-limit and temporary-outage statuses.
- Booking quotes are tied to their exact car, branch and dates; an older quote cannot enable submission after the inputs change. An unsupported branch now requires an explicit replacement selection.
- Comparison data is validated before rendering. Corrupted storage, duplicate cars, invalid prices, blocked browser storage and malformed optional fields cannot crash the comparison flow. Other tabs update the count and shortlist.
- CI applies every migration to a new PostgreSQL database and runs types, policy tests, chat workflows, media storage and business integration tests without application secrets.

### Evidence

- `npm test`: 27 passing tests.
- `npm run test:chat`: 5 passing HTTP/provider workflow tests.
- `npm run test:media`: 1 passing storage integration test.
- `RUN_DB_TESTS=1 npm run test:inventory`: 10 passing tests, including the four production-service lifecycle scenarios under their parent test. Fixtures use random IDs and are removed afterward. No emails were delivered and no Stripe API transactions were performed.
- `npm run typecheck` and `npm run build`: passed.
- `npm audit --omit=dev`: zero reported vulnerabilities.
- GitHub Actions independently passed the complete migration chain and all configured checks against fresh PostgreSQL.
- A live Gemini request with actual database inventory returned a nonempty answer and known recommendation IDs. The previous configured model's `404` and the replacement model's successful response were reproduced.
- Built-site browser checks: public catalogue and vehicle detail; multi-angle gallery controls; add/remove comparison and navigation count; mobile comparison at 390 × 844 in both themes without document overflow; native pickup changes automatically set a later return and minimum; server quote and available-unit count; VERO guest sign-in redirect with draft retained. No browser console errors were observed in this pass.
- HTTP checks: unauthenticated chat and maintenance return `401`; unsigned Stripe webhook returns `400`; malformed availability dates return a readable `400`.

The browser did not have a signed-in staff/customer session. Full authenticated UI journeys and external Stripe webhook delivery are not claimed as end-to-end verified. The actual business services are covered against PostgreSQL; external chat failure modes and HTTP flows use controlled provider fixtures. The inherited `next lint` command remains unsupported and is not counted as a check.

### Configuration

No new database migration is introduced by this review. The platform upgrade includes the two existing October inventory/branch migrations. A deployment must apply them using the company's migration procedure, configure its Clerk account, select its image store, and schedule `/api/maintenance` with `CRON_SECRET`. Stripe remains sandbox-only. See [deployment requirements](PLATFORM_UPGRADE.md) and [image storage](BRANCHES_IMAGES_AND_USAGE.md).

Google references: [model lifecycle](https://ai.google.dev/gemini-api/docs/deprecations), [Flash-Lite model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite), [structured output](https://ai.google.dev/gemini-api/docs/structured-output). The old model's failure was account-specific; this review does not claim it was globally retired.

![Comparison browser check](screenshots/comparison-review-light.png)

## After-merge review

The separate engineering and business-owner review will be recorded here after the upgrade is merged into `main`.
