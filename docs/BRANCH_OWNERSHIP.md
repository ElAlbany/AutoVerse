# Branch-owned car catalogues and stock

Implemented 2 November 2026, replacing the earlier shared-listing approach.

Each `Car` belongs to exactly one `Branch`. Frankfurt and Tirana can offer different models and quantities; the same model at both locations uses two independent listings. Editing one never changes the other.

`Car.quantity` stores the in-service fleet quantity, including booked vehicles. For example, three Audi A5 instances with one currently rented means quantity **3**, available now **2**, on hire **1**. Availability for a future trip is calculated for that entire period, including preparation and maintenance. It is deliberately not a manually decremented counter that could drift or expire incorrectly as time passes.

## Customer flow

- The homepage defaults to Frankfurt International Airport when open. Its branch combo changes the displayed catalogue without requiring dates or sign-in.
- Filters, pagination, vehicle links and booking links retain the branch. Featured vehicles and VERO recommendations respect the selected branch. Comparisons identify the collection branch.
- Cards show available versus total quantity. Date-specific counts remain authoritative only after selecting dates; booking rechecks under a database lock.

## Staff flow

- **Branches & stock** shows location cards with basic information and model/fleet counts. Click a card for its address, operating status, fleet statistics, searchable catalogue, date availability, recent rentals and branch settings.
- **Add car here** preselects that branch. **Edit car & stock** changes one branch's listing and numeric fleet quantity. The existing listing's branch is fixed; add a separate listing to offer the same model elsewhere.
- Increasing quantity creates physical instances or returns eligible retired instances to service. Reducing it retires only vehicles without active/upcoming reservations. Bookings, maintenance, preparation and overdue rentals cannot be removed by lowering a number. Existing history is retained.
- Fleet scheduling still manages the physical cars behind those quantities. Cross-branch unit transfers were replaced by managing the two independent listings. Fleet service changes update `Car.quantity` through an atomic database trigger.
- Bookings and physical units have database constraints enforcing the listing's branch, in addition to application checks. The overlap exclusion constraint remains in place.

## Migration and verification

Migration `20261102103000_branch_owned_stock` adds branch ownership, stock quantities, consistency constraints and quantity triggers. It preserves historical fields and splits legacy shared listings by their existing branch assignments when needed. Orders, units and reviews retain their appropriate relationships.

The authorized development migration preserved **49 listings, 50 physical units and 19 orders**, and renamed `branch-main` to **Frankfurt International Airport** (city Frankfurt). The existing **Tirana International Airport** branch remains empty until its own models and quantities are entered. No stock was invented or relocated. The previously flagged legacy vehicle assignment remains a staff reconciliation task.

Verification includes 31 unit/policy results, 13 PostgreSQL integration results, 5 chat workflow results and 1 media result: **50 passing results**. The new database test exercises independent same-model listings, different catalogue sizes, three-instance allocation, current versus date-specific counts, branch detail statistics, cancellation/return preparation, safe quantity reductions, concurrent edits versus booking, closed branches and direct cross-branch constraint rejection. Test fixtures are isolated and removed; no emails or real Stripe transactions are sent.

Browser QA verifies guest branch switching on the real public catalogue. Admin overview/detail/form components are checked with clearly labelled synthetic data at desktop and 390 px mobile width in both themes, without document overflow. Authenticated staff UI acceptance remains a target-environment check. Temporary preview routes are removed before building.

## Stripe on the rental page

When Stripe test keys and the webhook signing secret are configured, the rental form offers **Pay at collection** and **Demo card payment · Stripe**. Pay at collection is the default and confirms available stock immediately. Sandbox Checkout confirms only after verified payment. Real keys/events remain rejected. An existing booking request cannot be reused with a different payment method.

The local environment has no Stripe credentials configured, so it continues showing pay at collection. Configure the operator's sandbox, webhook forwarding/delivery and `APP_URL` to activate and verify the card-payment UI. No credentials were added and no real-money release is implied.

Apply the migration in any separate target database before deploying this code. Keep the custom quantity triggers and composite constraints in future migrations.
