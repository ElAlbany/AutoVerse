# Branches, imagery and driving suitability

Follow-up implementation, 31 October 2026. Each completed feature is committed and pushed on `codex/rental-platform-upgrade`.

## Booking and availability

- Pay-at-collection bookings confirm automatically when one physical vehicle can be allocated for the whole rental. No new 24-hour staff-review hold is created. Stripe sandbox bookings still require verified payment before confirmation, with a temporary checkout hold.
- Pickup rejects past times. Choosing a pickup automatically selects the following day for return if the previous return would be invalid. Return has a minimum later than pickup. Both browser and server validate dates; browser inputs use the customer's local timezone and requests use ISO instants.
- `Branch` stores the operator-controlled name, city, address and whether it accepts new rentals. Each `VehicleUnit` belongs to one branch; bookings record that branch and snapshot collection details. Public browsing remains available without signing in.
- The public branch combo filters listings by physical stock at that branch. With dates selected, the same unit must be available throughout the trip. A vehicle at Tirana cannot fulfil a booking at Brussels.
- Availability is derived, not an editable counter. Confirmed/active rentals, maintenance and preparation block allocation. Cancellation releases the reservation. Staff-recorded return leaves the preparation interval blocked, then the vehicle can be allocated again. Overdue active vehicles remain excluded until staff record return.
- Per-listing transaction locks and the PostgreSQL overlap exclusion remain authoritative under concurrent requests. Branch closure synchronizes with allocation through a branch row lock. An availability quote can change before submission; submission always checks again.
- Admin → Branches & stock creates/edits branches and shows per-model physical, in-service and date-available quantities. Close branches instead of deleting history. Existing bookings remain operational when a branch closes.
- Admin → Fleet calendar adds physical cars to branches, schedules maintenance, reassigns bookings within their booked branch, and transfers units only when no current/upcoming reservation or overdue rental remains. Existing legacy conflicts still need staff reconciliation; no stock is invented to resolve them.

## Why keep the fleet calendar?

Orders answer “who rented what?” The calendar answers “which exact physical car is occupied when?” Staff can see collection/return clashes, preparation gaps, maintenance and spare capacity across the next fourteen days. This is especially useful with two or three identical cars. The schedule has operational actions below the timeline and a branch filter. Times in staff scheduling are explicitly UTC.

## Seats and journey tags

Seat count is required (1–20) when staff create or edit a listing. Vehicles with different seating configurations should use separate listings. Existing demonstration rows received explicit configurations during migration (including 6/7/8-seat examples); these are demo data, not verified trim specifications. Before a company rollout, staff must verify every seat count against the actual vehicle and legal seating positions. No seats were inferred from an image.

Recommended journeys appear on listing cards, detail pages, comparison and the catalogue’s More filters. Tags include city driving, between cities, long-distance touring, short trips, family journeys, paved mountain routes and rough-road equipped. City driving is a recommendation, not a city-only restriction. Comfort and family suitability require operator judgement about the actual trim and party.

Terrain tags are deliberately conservative. [NPS guidance](https://www.nps.gov/thingstodo/drive-4x4-roads.htm) distinguishes routes suitable for ordinary two-wheel-drive vehicles from routes requiring high clearance and four-wheel drive, and says to check route and recent weather conditions. A generic SUV/AWD label is not sufficient evidence.

AutoVerse’s rough-road tag requires recorded clearance of at least 205 mm, low-range 4WD, suitable tyres and explicit operator approval. This is a product screening rule, not a universal road standard or safety guarantee. The operator must still verify the manufacturer’s guidance, road access, conditions and rental permission for each route. No existing demo car was automatically tagged for mountains or rough roads. VERO receives the stored tags and instructions against inferring terrain safety from body style or AWD.

## API illustrations and real photography

Staff choose one imagery source per listing:

1. **Model illustrations / API** restores the original IMAGIN.studio integration. Gallery angles 01, 21 and 13 provide front, side and rear viewpoints, following the [provider’s angle documentation](https://docs.imagin.studio/guides/getting-images/ii.-image-customization-and-styling/selecting-angles). Images are labelled model illustrations because trim/colour/equipment can differ. `NEXT_PUBLIC_IMAGIN_CUSTOMER` defaults to the original demo `img` customer. Confirm licensing and obtain the appropriate customer key for commercial sale; ongoing free commercial service is not promised.
2. **Real vehicle photos** accepts up to twelve operator-owned photos, lets staff select the cover and remove images from the listing. Existing hosted HTTPS URLs can also be added. Operators should include front, side, rear, interior and luggage views of the actual rental configuration.

Admin-only uploads accept JPEG/PNG/WebP up to 3 MB per file and 24 megapixels. Server-side decoding rejects spoofed/unsupported content and animated images, re-encodes to WebP within 1600 × 1200, and strips metadata including EXIF/GPS. Unique immutable keys avoid overwriting photos used elsewhere. The database stores URLs, not image bytes. Removing a photo from a listing does not delete the underlying storage object; audit references before storage cleanup, including uploads abandoned before saving.

### Storage choices

Do not save runtime uploads in deployed `public`. [Vercel Functions](https://vercel.com/docs/functions/runtimes#file-system-support) provide a read-only deployment filesystem and temporary scratch space, not a persistent upload disk.

- **Cloudflare R2 / S3-compatible storage:** set `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_PUBLIC_URL` and optionally `S3_REGION` (R2 uses `auto`). The adapter uses the [official AWS SDK-compatible approach](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/). Create a bucket, a bucket-scoped write credential and public delivery domain. `S3_PUBLIC_URL` must serve that bucket; it is not the authenticated S3 API endpoint. Set an explicit image-host allowlist for the chosen provider in `next.config.js` before company deployment. Never use `NEXT_PUBLIC_` for storage credentials.
- **Free allowance:** [R2 Standard pricing](https://developers.cloudflare.com/r2/pricing/) currently includes 10 GB-month of storage, one million Class A and ten million Class B operations each month, plus free egress. Usage beyond the allowance is billed; this is not unlimited free storage. Account setup and billing/budget controls are the operator’s responsibility. No storage account was created during this work.
- **Local development:** with S3 settings empty, photos go to ignored `.uploads/` and are served by `/api/media/[key]` through a strict UUID filename check.
- **Self-hosted production:** an explicit absolute `UPLOAD_DIR` outside `public` can point to a persistent mounted disk. Back it up and share it across app instances. Disk capacity and hosting still have costs.
- **Serverless production:** object storage is required; uploads report a clear configuration error if it is absent. The API illustration option remains usable.

## Navigation and recovery

Compare cars is visible in desktop/mobile navigation and the account sidebar, with the selected count. Route loading, recoverable error, global-error and not-found screens provide useful next actions. Admin tables keep their header and first column visible, provide a top horizontal scrollbar and arrow controls, and support mouse dragging. Smaller screens retain readable cards rather than forcing wide tables.

## Verification and limits

- Unit tests cover pricing/date/redirect rules, automatic return dates, rough-road tag prerequisites, gallery source/angles, photo validation, size limits, resizing and metadata removal.
- Development database tests cover concurrent one/two-unit allocation, overlap exclusion, preparation boundaries, fragmented periods, branch isolation/cancellation/return/closure and sandbox signature/amount/replay validation. Random fixtures are removed by ID; no emails or external payment calls are made.
- Storage tests round-trip temporary local files and reject traversal/partial configuration. Production R2 credentials were not available, so the external bucket connection has not been verified.
- Authenticated admin interactions and external Stripe checkout require configured sessions and provider accounts; no bypass was added for testing.
- The existing Next.js 16 `next lint` script is unsupported and is not claimed as a passing check.

## Final QA checkpoint

- Passed: `npm test` (13 tests), `npm run test:media` (1 test), `RUN_DB_TESTS=1 npm run test:inventory` (4 tests), TypeScript, production build, Prisma schema validation and migration status. All six migrations are applied to the authorized development database. `npm audit` reported zero known vulnerabilities.
- Browser: the restored API actually returned vehicle images; switching to the rear view loaded angle 13. Light desktop and both mobile themes were inspected. At 390 px viewport width, the document content was 382 px wide, with no horizontal page overflow. Native pickup editing automatically filled the following-day return and set its minimum to pickup plus one minute. Branch-specific count and quote loaded successfully.
- Mobile navigation exposes Compare cars and updates its selected count; the selected car and journey tags appear in the comparison, and removal updates the shortlist. The public loading and friendly not-found screens were observed. Anonymous upload/status requests returned 403; invalid photo keys and unknown pages returned 404.
- [Gallery, desktop light](screenshots/gallery-desktop-light.png)
- [Branch and dates, mobile dark](screenshots/branch-booking-mobile-dark.png)
- [Branch and dates, mobile light](screenshots/branch-booking-mobile-light.png)
- No existing customer records were deleted, and no real booking was created by browser QA. Integration fixtures clean up only their own random IDs. The development database may continue changing through normal user activity; do not restore old row counts as a cleanup operation.

Feature checkpoints: `f22ab85` instant confirmation and date controls, `cf8b526` comparison/table navigation, `699aa8b` route recovery, `9018363` branches and inventory migration, `15e5ee7` seats/journey tags, `883d56a` gallery/uploads, and `8def4d8` staff reassignment safeguards.
