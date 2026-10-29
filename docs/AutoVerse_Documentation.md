# AutoVerse — Project Documentation

Last updated: 2026-10-29
Repository: E:\Programming\FrontEnd\pojects\car_showcase
Project owner: Zaid Hany (as recorded in the original handover).

This document describes the features and implementation present in the local repository. It is a standalone product overview and technical handover. The source code takes precedence where older documentation differs. This update was checked against source files; it does not certify a live deployment, external service availability, or successful runtime tests.

## 1. Project Overview

AutoVerse is a full-stack car rental application. Visitors discover vehicles through a searchable catalogue, view specifications and prices, and ask VERO for recommendations from the available fleet. Signed-in customers create rental bookings and manage them through a personal dashboard. Administrators manage vehicles, orders, users, and AI recommendation analytics.

The product combines three main areas:

- Customer experience: vehicle discovery, booking, rental tracking, and account settings.
- Administration: fleet management, order processing, user roles, and operational summaries.
- VERO: an AI car assistant with inventory-backed recommendations and a dedicated analytics dashboard.

The displayed currency is dollars. A booking records a rental request; payment collection is not implemented.

## 2. Technology Stack

Versions below are dependency declarations in package.json, not guarantees of the versions running in production.

| Area | Implementation |
| --- | --- |
| Framework | Next.js ^16.2.12, App Router |
| UI | React / React DOM ^19.2.8 |
| Language | TypeScript ^6.0.3, strict mode |
| Styling | Tailwind CSS 3.3.2, global CSS, light/dark theme tokens |
| Database | PostgreSQL; Neon is the hosting service described in the existing handover |
| ORM | Prisma / Prisma Client ^6.19.3 |
| Authentication | Clerk ^7.6.4 |
| Email | Resend ^6.18.1 |
| AI | Google Gemini REST generateContent API |
| UI primitives | Headless UI ^2.2.10 |
| Vehicle imagery | Imagin.studio CDN and local public assets |
| Tooling | npm, package-lock.json, tsx ^4.23.1 |
| Deployment | Vercel is the deployment target described in the existing handover |

The installed Next.js package requires Node.js >=20.9.0. The repository also declares @google/generative-ai, but the current chat endpoint calls Google's REST API directly.

## 3. Customer Features

### 3.1 Homepage and Vehicle Discovery

- Animated hero with aurora effects, floating particles, a vehicle visual, and a button that scrolls to the catalogue.
- Hero marketing figures are static display values, not live database statistics.
- Homepage featured section shows up to four available, featured vehicles independently of catalogue filters.
- /featured displays the full available featured selection, ordered by newest.
- Catalogue cards show vehicle imagery, make/model, daily price, key specifications, featured badges, and unavailable states.
- The main catalogue can include unavailable vehicles; the featured selection and VERO inventory require available=true.
- Search matches make, model, or description using case-insensitive substring queries.
- Additional filters cover manufacturer, model, year, fuel, transmission, drive, class, and minimum/maximum daily price.
- Sorting supports newest first and daily price ascending or descending.
- Filters are represented in URL query parameters, enabling shareable links and browser navigation. Controls include applying, clearing, and removing individual active filters.
- The catalogue initially loads ten results. Show More increases the limit in steps of ten, preserves scroll position, and disappears when no more results remain.

Relevant URL parameters: search, manufacturer, model, year, fuel, transmission, drive, class, minPrice, maxPrice, sort, and limit.

### 3.2 Vehicle Details

/car-details/[id] provides a dedicated vehicle page with breadcrumbs, a main image, front/side/rear gallery views, specifications, description, daily pricing, rental information, and booking links. Unknown vehicle IDs use Next.js notFound().

Some displayed information is presentation content: for example, the details page uses a fixed five-person seat label rather than a database seat-capacity field. Rental policy text is not a separate insurance, roadside assistance, or mileage-management integration.

### 3.3 Booking

- /rent?carId=<id> loads the selected car, preview image, specifications, and rental form. Missing or unknown car IDs return notFound().
- The form accepts pick-up and return dates and displays the daily rate, duration, and calculated total.
- Duration uses the rounded-up date difference with a minimum of one day; the form labels insurance and fees as included.
- Date inputs restrict past pick-up dates and return dates before pick-up through browser controls.
- Guests submitting a booking are sent to /sign-in. The server action also requires authentication and an existing local user record.
- The server verifies that the vehicle exists and is globally marked available, then creates a PENDING order.
- A successful submission redirects to /profile/orders and attempts to send an order-received email.
- The form displays a cancellation warning when pick-up is within the two-day cutoff.

Current limitations: the server accepts the total supplied by the client, does not independently enforce date ordering or future dates, and does not check overlapping bookings. The availability flag is not a date-specific reservation calendar. No payment gateway or refund transaction is connected.

### 3.4 Authentication and Customer Account

- Clerk provides /sign-in and /sign-up routes and session handling.
- getOrCreateUser() in lib/sync-user.ts creates a local Prisma user from Clerk when needed. The homepage calls it; it is not a webhook or a synchronization process on every request.
- Existing local user records are returned as-is, so Clerk profile changes are not continuously mirrored into PostgreSQL.
- /profile and its child routes require a signed-in Clerk session and a matching local user.
- /profile/account embeds a theme-aware Clerk UserProfile for email, password, and connected-account settings, using hash routing.
- Sign-out returns to the homepage.

### 3.5 Profile Dashboard and Orders

- /profile shows a welcome area and four statistics: current orders, total orders, completed orders, and total spent.
- The card labeled Active includes PENDING, CONFIRMED, and ACTIVE orders. Total spent sums non-cancelled order values; it does not verify collected payments.
- A next-rental card shows the nearest upcoming rental with a days-until-pick-up value. An activity timeline shows recent orders.
- /profile/orders separates Current (PENDING, CONFIRMED, ACTIVE) from History (COMPLETED, CANCELLED).
- Status filters adapt to the selected tab. Sort options include newest, total price high/low, and pick-up date.
- Order cards include vehicle imagery, dates, price, status badges, progress, and detail links.
- /profile/orders/[id] shows the vehicle, rental details, timeline, price summary, and cancellation control where applicable. The data action permits only the owner or an administrator.
- Order-list cancellation uses optimistic UI updates while the server action runs.
- Completed-order pages display a Write a Review button, but no review submission behavior is connected.

## 4. Order Lifecycle and Cancellation Rules

Standard lifecycle:

PENDING -> CONFIRMED -> ACTIVE -> COMPLETED

Administrators can use these server-validated transitions:

| Current status | Allowed next statuses |
| --- | --- |
| PENDING | CONFIRMED, CANCELLED |
| CONFIRMED | ACTIVE, CANCELLED |
| ACTIVE | COMPLETED, CANCELLED |
| COMPLETED | CANCELLED |
| CANCELLED | None |

Customer cancellation requires ownership, an order that is neither COMPLETED nor CANCELLED, and a time before the cutoff calculated as midnight on the pick-up date minus two calendar days. The UI presents this as a 48-hour policy, but the implementation uses calendar-day boundaries. Customer cancellation and admin cancellation have different restrictions; the admin action currently permits cancelling completed orders.

lib/order-sync.ts automatically changes CONFIRMED orders to ACTIVE when their start date is before tomorrow, then changes ACTIVE orders to COMPLETED when their end date is before today. These updates run when the profile layout executes. The current admin layout does not call this helper. There is no scheduled background job, and automatic updates do not send email.

Date boundaries use the execution environment's Date behavior; deployment timezone settings can affect cutoff and reporting behavior.

## 5. Admin Features

### 5.1 Access and Layout

proxy.ts redirects unauthenticated /admin requests to sign-in. app/admin/layout.tsx checks the local user's ADMIN role and redirects other users to /. Admin server actions repeat authorization checks before mutations.

Below Tailwind's lg breakpoint (1024px), admin navigation becomes a horizontally scrollable pill bar and management tables use stacked card layouts. Desktop layouts use a sticky sidebar and full tables. Search controls also adapt to smaller screens.

### 5.2 Operational Dashboard — /admin

- Period selection: All Time, This Month, This Year.
- Main cards: total orders, pending, confirmed, completed, total cars, and revenue.
- Quick statistics: registered users, completion rate, pending rate, and average order value.
- Revenue is the sum of non-cancelled order totals, not settled payments; average order value divides that revenue by the total order count.
- Order counts and revenue follow the selected creation-date period; fleet and user totals are global.
- A VERO Analytics link card shows chat, recommendation, and unique-user figures.
- The dashboard's chat/recommendation preview uses the latest 100 analytics records; its unique-user count is global. These preview figures are not filtered by the dashboard period and can differ from the dedicated analytics page.

### 5.3 Fleet Management — /admin/cars

- Searchable fleet list with add, edit, and delete actions.
- Reusable CarForm collects identity, year, daily price, fuel, transmission, drive, vehicle class, economy/engine specifications, description, availability, and featured status.
- New vehicles receive five generated Imagin.studio image angles.
- Editing can explicitly regenerate images; changing make, model, or year also regenerates them.
- Availability and featured switches use optimistic UI updates.
- Deletion requires a browser confirmation. Database cascade rules also remove associated orders and reviews.
- Mutations revalidate relevant catalogue, admin, and detail paths as implemented in app/actions/admin.ts.

### 5.4 Order Management — /admin/orders

- Search by order ID, customer name/email, or vehicle make/model.
- View customer, vehicle, rental dates, total, and current status.
- Inline status dropdown exposes the allowed transitions listed above, with server validation and pending/error feedback.
- Manual status updates attempt to send a corresponding customer email.

### 5.5 User Management — /admin/users

- Search by first name, last name, or email.
- Summary cards show users, admins, customers, and orders; rows include identity, role, and order count.
- Promote/demote between USER and ADMIN; administrators cannot demote themselves.
- Delete a local database user after confirmation; administrators cannot delete themselves.
- User deletion cascades to orders and reviews and sets related chat analytics userId to null.
- This action does not delete the corresponding Clerk account. A retained Clerk identity can create a new local record through the existing user-creation flow.

## 6. VERO AI Car Assistant

### 6.1 Chat Interface

VeroChat is mounted by the root layout and is available throughout the site, including for guests. It provides:

- Floating launch button and animated chat panel with light/dark styling.
- Welcome prompt asking about daily budget and passenger count.
- Open/close, maximize/minimize, and reset controls.
- Enter to send, Shift+Enter for a newline, automatic scrolling, input focus, and typing indicators.
- Basic bold/italic text rendering and line breaks.
- Recommendation cards containing image, vehicle name, class, daily price, and a Book link to /rent?carId=<id>.
- Connection and quota-error feedback. Sending is disabled during a pending request.
- Browser-local persistence under the exact key vero-chat-session, restored if its saved timestamp is less than one hour old. Saving refreshes the timestamp.

There is no explicit 20-message history cap, sound toggle, cross-device chat synchronization, or token-streaming transport in the current component. Responses arrive as a completed JSON response even though an internal state variable is named streaming.

### 6.2 Recommendation Backend — POST /api/chat

1. Accepts messages containing role/content history and reads the optional Clerk identity.
2. Loads all vehicles marked available from PostgreSQL.
3. Uses passenger-count and budget/luxury keyword heuristics to filter or reorder inventory. Passenger suitability is inferred from vehicle class, not actual seat data.
4. Supplies up to 15 candidate vehicles with IDs, names, prices, class, transmission, and featured markers to the model.
5. Calls the hardcoded gemini-3.5-flash:generateContent REST endpoint with a system prompt, the message history, and generation settings (1000 output tokens, temperature 0.8, topP 0.95).
6. Requests natural-language recommendations followed by a hidden RECOMMENDED: id-1, id-2 line. The prompt requests one to four suitable cars, but that count is not independently enforced by the parser.
7. Removes the metadata line, validates returned IDs against available inventory, and falls back to matching vehicle names in the response when no IDs were extracted.
8. Resolves recommendation cards and attempts to store the latest user message and recommended IDs in ChatAnalytic.
9. Returns { text, recommendedCars } to the client.

The route parses a metadata marker, not a structured JSON document generated by Gemini. Analytics insertion is awaited inside a separate try/catch: a logging failure does not fail an otherwise successful chat response, but the insertion can add latency.

Signed-in messages are linked to a local user only if a matching database record already exists; guests and unmatched identities are stored with userId=null. The endpoint reports missing configuration, provider errors, quota errors, and unexpected failures. Provider model availability and quota depend on the configured Google account and were not verified during this documentation update; hardcoded quota/billing text in the application should not be treated as a provider guarantee.

## 7. VERO Analytics — /admin/analytics

- Admin-only page with preset filters: Today, Yesterday, Last 7 Days, This Month, This Year, All Time.
- Custom From/To inputs prevent choosing a To date before From through the UI. Apply writes period=custom, from, and to to the URL; changing filters resets feed pagination. Clear restores the unfiltered view.
- Four statistics: Conversations, Recommendations, Unique Users, and Average Cars per Chat.
- Each successful logged user request creates one analytics row. The interface calls these conversations, but rows are individual messages, not distinct conversation sessions.
- Recommendations counts the lengths of stored carsShown arrays. Unique Users counts distinct non-null local user IDs and excludes anonymous visitors.
- Pure SVG activity line chart with curved segments, area fill, hover tooltips, and a centered single-point case.
- Chart data groups records by UTC date, shows the last 30 dates that contain activity, and does not insert missing zero-activity days.
- Most-recommended list ranks up to six vehicle IDs by appearance frequency and displays currently existing vehicle details.
- Customer conversation feed contains up to eight records per page, showing customer/guest identity, timestamp, message text, and recommended vehicles linking to details pages.
- Numbered pagination includes previous/next controls and ellipses; page links preserve date filters. Out-of-range positive pages redirect to the last page when results exist.
- A route-specific skeleton is displayed while the page loads.

Implementation: a date-filtered lightweight query loads createdAt and carsShown for aggregation, a separate query loads the paginated feed with user details, and only needed vehicle records are resolved. Aggregation still reads all matching analytics rows into memory; this is not database-only aggregation or a guarantee of unlimited scale. Full chat transcripts, assistant replies, and booking-conversion attribution are not stored in ChatAnalytic.

## 8. Shared UI and Email

- Fixed navigation with scroll-dependent styling, authentication controls, and theme switching.
- Default dark theme; Navbar writes a theme cookie lasting one year. The root layout applies the corresponding html class before first paint.
- Tailwind dark classes and CSS variables provide the primary site-wide theming system. Some form/error areas still use light-specific styles, so theme support should be visually checked per page.
- Reusable searchable selects, buttons, vehicle/order cards, status badges, order progress, sidebars, and footer.
- Loading boundaries exist for the root, profile, rental, vehicle-detail, and analytics routes. app/error.tsx provides retry/navigation recovery.
- Resend is initialized lazily; absent RESEND_API_KEY causes email to be skipped. Sending errors are caught and logged.
- Email attempts occur for booking creation, successful customer cancellation, and manual admin status updates. Date-driven status synchronization does not invoke the mail helper.
- Templates include order ID, vehicle, dates, status, and total. They still use CarHub branding and the sender CarHub <onboarding@resend.dev>; production branding/sender configuration needs attention.

## 9. Repository Map and Architecture

All paths below are relative to E:\Programming\FrontEnd\pojects\car_showcase.

| Path | Responsibility |
| --- | --- |
| app/page.tsx | Homepage queries, catalogue filters, featured selection, user creation |
| app/layout.tsx | Shared shell, ClerkProvider, theme bootstrap, VERO |
| app/actions/admin.ts | Fleet CRUD, status transitions, roles, local user deletion |
| app/actions/order.ts | Get/list/create/cancel customer orders |
| app/actions/user.ts | Older user synchronization action |
| app/api/chat/route.ts | AI provider integration, live inventory, recommendation logging |
| app/admin/ | Dashboard, fleet, orders, users, analytics, admin layout |
| app/profile/ | Dashboard, current/history orders, detail, account settings |
| app/car-details/[id]/page.tsx | Vehicle details |
| app/rent/page.tsx | Booking page selected through carId |
| app/featured/page.tsx | Available featured collection |
| app/sign-in/ and app/sign-up/ | Clerk catch-all authentication routes |
| components/ | Shared customer UI and VeroChat.tsx |
| components/admin/ | Admin navigation, forms, tables, searches, chart, date filter |
| lib/prisma.ts | Development-safe Prisma singleton |
| lib/sync-user.ts | Create local user from Clerk if missing |
| lib/order-sync.ts | Date-based order status updates |
| lib/email.ts | Resend status templates and delivery helper |
| lib/car-options.ts | Vehicle form reference options |
| types/, constants/, utils/ | Shared interfaces, options, helpers, mock seed data |
| prisma/schema.prisma | Data models and relations |
| prisma/migrations/ | Initial schema, order/review changes, roles, chat analytics |
| prisma/seed.ts | Mock vehicle insertion; skips if any car already exists |
| public/ | Static PNG/SVG assets |
| proxy.ts | Clerk middleware and unauthenticated admin redirect |
| prisma.config.ts | Prisma schema, migration path, dotenv/database configuration |
| next.config.js | Next image remote allowlist for cdn.imagin.studio |
| tailwind.config.js / app/globals.css | Styling configuration, tokens, animations |
| tsconfig.json | Strict TypeScript and @* root aliases |
| AGENTS.md | Repository contributor guidelines |

Pages primarily use Server Components that query Prisma directly. Interactive forms, filtering, chat, and optimistic updates use Client Components. Mutations use server actions and revalidate affected paths. Decimal prices and dates are normalized when preparing data passed into client-facing objects. Shared imports use aliases such as @components and @/lib/prisma.

The existing Searchbar.tsx, CustomFilter.tsx, SearchManufacturer.tsx, and some utilities remain from earlier catalogue implementations; the active homepage uses CarFilters.tsx and database-backed queries. Do not assume every retained helper is part of the current product flow.

## 10. Data Model

- User: UUID, unique Clerk ID/email, profile fields, USER/ADMIN role, timestamps, orders, reviews, and analytics relations.
- Car: identity, year, Decimal daily price, fuel/transmission/drive/class, economy and engine specifications, image URLs, description, available/featured flags, and creation time.
- Order: user and car references, date range, Decimal total, lifecycle status, timestamps, and optional review.
- Review: unique order reference, user/car references, rating, optional comment, and creation time. The schema exists; an end-to-end review feature does not.
- ChatAnalytic: optional user reference, submitted message, array of recommended car IDs, and creation time. Recommended IDs are strings rather than foreign-key relations to Car.

Deleting users/cars cascades through their orders and reviews. Deleting a user retains analytics with a null user reference. Deleting a car can leave its old ID in analytics arrays, so historical cards may no longer resolve. Complete schema snapshot appears in the appendix.

## 11. Configuration and Local Development

Use Node.js compatible with the installed Next.js requirement and npm. Keep secrets in ignored environment files; both .env and .env*.local are ignored in this repository. There is currently no .env.example file to copy.

| Variable | Purpose |
| --- | --- |
| DATABASE_URL | PostgreSQL connection used by Prisma/runtime configuration |
| DIRECT_URL | Direct PostgreSQL connection referenced by schema.prisma |
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Browser-safe Clerk application key |
| CLERK_SECRET_KEY | Server-side Clerk secret |
| NEXT_PUBLIC_CLERK_SIGN_IN_URL | Clerk sign-in path, normally /sign-in |
| NEXT_PUBLIC_CLERK_SIGN_UP_URL | Clerk sign-up path, normally /sign-up |
| NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL | Post-sign-in setting documented in README |
| NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL | Post-sign-up setting documented in README |
| RESEND_API_KEY | Optional email delivery integration |
| GEMINI_API_KEY | Required to use VERO's external AI endpoint |

Next.js supports .env.local; Prisma's configuration explicitly imports dotenv/config. Ensure the database variables are available to the CLI as well as the web runtime, for example through an ignored .env or the shell environment. Do not assume Prisma automatically loads Next.js-specific environment files. Configure corresponding environment variables on the deployment host.

Key commands, run from the repository root:

| Command | Purpose |
| --- | --- |
| npm ci | Install the lockfile dependency set |
| npm run dev | Start local development, normally http://localhost:3000 |
| npm run build | Run prisma generate, then next build |
| npm start | Serve an existing production build |
| npx tsc --noEmit | Type-check the project |

Database setup must apply the repository's Prisma schema/migrations to the intended development database before using data-backed pages. prisma/seed.ts contains optional mock fleet data and package.json declares its seed command through tsx. Initial admin access requires assigning ADMIN to the intended local User record through trusted database administration; new users default to USER.

npm run lint still invokes next lint, which the installed Next.js 16 CLI does not support. There is no configured ESLint/Prettier setup, automated test script, or coverage requirement. A documentation edit alone does not establish a passing application build.

## 12. Current Gaps and Handover Notes

The feature descriptions above cover implemented source behavior. Remaining work visible in the repository includes:

- Booking hardening: server-side price calculation, full date validation, and collision/concurrency handling for overlapping rentals.
- Real payments/refunds: current payment/insurance/refund wording is UI content without a transaction integration.
- Reviews: schema and completed-order button exist; submission, moderation, and display are not wired up.
- Lifecycle consistency: automatic status changes run through the profile layout, not a background scheduler or admin layout; automatic transitions do not email customers.
- Policy consistency: vehicle-detail cancellation wording differs from the two-day customer cutoff, and admins can cancel completed rentals.
- Identity lifecycle: local user deletion does not remove Clerk accounts; existing profile fields are not continuously synchronized.
- AI operation: verify the hardcoded provider model and account quotas, improve request validation and abuse controls, and use real vehicle seat data if passenger suitability becomes a requirement.
- Chat privacy/retention: submitted user messages and recommended IDs are stored for admins; no dedicated retention management is implemented.
- Reporting: dashboard preview counters are sampled/mixed-scope; revenue/spend labels represent order totals, not collected money.
- Polish/tooling: replace remaining CarHub email branding, verify sender setup and asset fallbacks, check theme coverage, and configure lint/tests.

These items describe the current implementation boundaries; they are not claims that features were added during this documentation update.

## 13. Verification Checklist

When validating a configured environment:

1. Install dependencies, configure database/Clerk credentials, apply the intended database setup, and optionally seed the fleet.
2. Run type checking and a production build; record any failures instead of assuming prior handover status still applies.
3. Test homepage search, every filter family, price sorting, clear/remove controls, shareable URLs, featured views, and Show More.
4. Open vehicle details and booking links; check invalid IDs and unavailable vehicles.
5. Test signed-in booking creation, guest sign-in redirects, totals, validation feedback, profile order visibility, and cancellation cutoff boundaries.
6. Verify access restrictions for guests, customers, admins, and attempts to read another customer's order.
7. Exercise admin vehicle CRUD/toggles, user role changes, self-action restrictions, searches, and allowed/rejected order transitions against disposable development data.
8. Confirm date-driven transitions when the profile layout executes; separately check email attempts for the actions that call the mail helper.
9. Ask VERO budget, premium, and passenger questions; inspect recommendation prices/images, maximize/minimize/reset, one-hour storage restoration, error handling, and Book links.
10. Verify analytics rows, guest attribution, all date presets, custom ranges, chart edge cases, vehicle rankings, and feed pagination.
11. Check mobile/desktop layouts and both themes across customer pages, admin pages, account settings, forms, loading states, errors, and chat.
12. Validate production environment variables and actual external-service behavior before deployment sign-off.

## Appendix: Current Prisma Schema

The following snapshot is copied from prisma/schema.prisma as part of this documentation update. Update it when the data model changes.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String   @id @default(uuid())
  clerkId       String   @unique
  email         String   @unique
  firstName     String?
  lastName      String?
  phone         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  role          String   @default("USER")
  orders        Order[]
  reviews       Review[]
  chatAnalytics ChatAnalytic[]
}

model Car {
  id              String   @id @default(uuid())
  make            String
  model           String
  year            Int
  pricePerDay     Decimal  @db.Decimal(10, 2)
  fuel_type       String
  transmission    String
  drive           String
  city_mpg        Int
  class           String
  combination_mpg Int
  cylinders       Int
  displacement    Float
  highway_mpg     Int
  images          String[]
  description     String?
  available       Boolean  @default(true)
  featured        Boolean  @default(false)
  orders          Order[]
  reviews         Review[]
  createdAt       DateTime @default(now())

  @@index([make])
  @@index([fuel_type])
  @@index([year])
  @@index([available])
}

model Order {
  id         String      @id @default(uuid())
  userId     String
  carId      String
  startDate  DateTime
  endDate    DateTime
  totalPrice Decimal     @db.Decimal(10, 2)
  status     OrderStatus @default(PENDING)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  car        Car         @relation(fields: [carId], references: [id], onDelete: Cascade)
  review     Review?
}

model Review {
  id        String   @id @default(uuid())
  orderId   String   @unique
  userId    String
  carId     String
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  car       Car      @relation(fields: [carId], references: [id], onDelete: Cascade)
}

model ChatAnalytic {
  id        String   @id @default(uuid())
  userId    String?
  message   String
  carsShown String[]
  createdAt DateTime @default(now())
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
}

enum OrderStatus {
  PENDING
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
}
