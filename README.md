# AutoVerse — Car Rental Platform

> **Find, book, and rent a car — quick and super easy.**

A production-ready, full-stack car rental platform built with Next.js 16 App Router. AutoVerse covers the complete rental lifecycle — from browsing a curated catalogue and booking a vehicle, to managing orders through a personal dashboard and administrating the entire platform through a dedicated admin panel.

**Live Demo:** [autoverse.vercel.app]([https://your-live-url.vercel.app](https://auto-verse-tau.vercel.app/)) &nbsp;

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Key Engineering Decisions](#key-engineering-decisions)

---

## Features

### Customer-Facing

- **Aurora Hero Section** — animated gradient background with floating particles and live platform stats
- **Featured Vehicles** — curated homepage preview of top-tier cars with a dedicated `/featured` page showing the full collection
- **Car Catalogue** — paginated grid with "Show More" pagination that hides automatically when all results are loaded
- **Advanced Filter System** — full-text search across make, model, and description; price range (min/max); sort by newest, price low→high, price high→low; all filters stored in URL query params for shareable and bookmarkable links; active filters shown as removable pill badges
- **Car Detail Page** — full gallery, key specs, rental info card, and a prominent "Rent This Car" CTA
- **Booking Flow** — authenticated rent form with date picker (pick-up and return), total price calculation, and instant booking confirmation
- **Auth Guard** — unauthenticated users attempting to rent are redirected to sign-in and returned to the booking page after login
- **Transactional Emails** — automated emails at every order status change (created, confirmed, active, completed, cancelled) via Resend

### User Profile

- **Dashboard** (`/profile`) — 4 stat cards (active orders, total orders, completed, total spent), next upcoming rental with countdown, vertical activity timeline of recent events
- **Orders Center** (`/profile/orders`) — full order list with tab filters (Current / History), status sub-filters (All, Pending, Confirmed, Active), sort options, and per-order visual progress bar (Pending → Confirmed → Active → Completed)
- **Order Detail** (`/profile/orders/[id]`) — full breakdown with interactive timeline
- **Account Settings** — theme-aware Clerk `<UserProfile />` component for managing email, password, and connected accounts
- **Optimistic Cancel** — order cancellation updates the UI instantly via `useOptimistic` before the server confirms

### Admin Panel (`/admin`)

- **Role Guard** — server-side check on every admin route; non-admins are redirected to `/`
- **Dashboard** — stats for total orders, pending, confirmed, completed, total cars, revenue, and quick stats (registered users, completion rate, pending rate, average order value); filterable by All Time / This Month / This Year
- **Car Management** — full CRUD; searchable table with available and featured toggle switches using `useOptimistic` for instant feedback; featured cars marked with amber star badge
- **Order Management** — searchable orders table with inline status updater dropdown; only valid next-state transitions are shown (e.g. PENDING can only move to CONFIRMED or CANCELLED)
- **User Management** — user list with stat cards, role promotion/demotion via inline select (admins cannot demote themselves), and user deletion with cascade warning
- **Fully Responsive** — below `lg` breakpoint, all admin tables convert to stacked card layouts per row; sidebar nav collapses to a horizontal scrollable pill bar

### Platform-Wide

- **Dark / Light Theme** — cookie-driven with a `<head>` inline script that applies the theme class before first paint, eliminating flash-of-incorrect-theme on hard reload; persisted for 1 year
- **Fully Responsive** — mobile-first design across all pages; `lg` as the single layout breakpoint throughout
- **Automatic Order Sync** — `lib/order-sync.ts` runs on every `/admin/*` and `/profile/*` load, auto-advancing CONFIRMED → ACTIVE when the start date arrives, and ACTIVE → COMPLETED when the end date passes

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 3 with custom CSS variable theming |
| **Database** | PostgreSQL (hosted on Neon) |
| **ORM** | Prisma 6 |
| **Authentication** | Clerk |
| **Email** | Resend |
| **UI Primitives** | Headless UI |
| **Images** | Imagin.studio CDN (dynamic car images by make/model/year) |
| **Deployment** | Vercel |
| **Font** | Manrope (Google Fonts) |

---

## Architecture Overview

### Server Components First

Pages are React Server Components by default. They query Prisma directly — no API routes needed for data fetching. This keeps sensitive database logic off the client and eliminates redundant network round-trips.

```
Browser → Next.js Server Component → Prisma → Neon PostgreSQL
```

Client Components are used only where interactivity is required (filters, forms, toggles, optimistic updates).

### Serialization Rule

Prisma's `Decimal` and `Date` types are not serializable to JSON. Every server component that passes data to a client component explicitly converts these before the boundary:

```ts
// Always do this before passing Prisma data to client components
const serialized = {
  ...car,
  pricePerDay: Number(car.pricePerDay),   // Decimal → number
  createdAt: car.createdAt.toISOString(), // Date → string
}
```

Raw Prisma objects are never spread directly into client component props.

### Auth & User Sync

Clerk manages authentication (sign-in, sign-up, session). On every authenticated request, `lib/sync-user.ts` runs `getOrCreateUser()` which syncs the Clerk user into the Prisma `User` table, creating the record if it does not exist yet. This keeps the two systems in sync without webhooks.

```
Clerk Session → getOrCreateUser() → Prisma User record
```

### Order Status Lifecycle

```
PENDING ──► CONFIRMED ──► ACTIVE ──► COMPLETED
   │              │           │
   └──────────────┴───────────┴──► CANCELLED
```

- Admin manually promotes `PENDING → CONFIRMED`
- `lib/order-sync.ts` auto-advances `CONFIRMED → ACTIVE` when `startDate` is reached
- `lib/order-sync.ts` auto-advances `ACTIVE → COMPLETED` when `endDate` passes
- CANCELLED is available from any state except COMPLETED

### Filter Architecture

`CarFilters.tsx` is a Client Component that holds all filter state locally. When the user clicks "Apply", it updates the URL query params. The parent Server Component (`app/page.tsx`) reads those params, builds the Prisma `where` clause, and re-fetches — the URL is the single source of truth.

```
User interaction → URL params → Server re-fetch → Prisma query → Updated results
```

### Dark Mode

Tailwind's `darkMode: "class"` strategy is used. An inline `<script>` in `<head>` reads the `theme` cookie and sets the `dark` class on `<html>` before the browser paints, preventing any flash of the wrong theme. Toggling writes a new cookie (1-year expiry) and flips the class without a page reload.

---

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique
  email     String   @unique
  firstName String?
  lastName  String?
  phone     String?
  role      String   @default("USER") // "USER" | "ADMIN"
  orders    Order[]
  reviews   Review[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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
  highway_mpg     Int
  combination_mpg Int
  cylinders       Int
  displacement    Float
  class           String
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
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  car        Car         @relation(fields: [carId], references: [id], onDelete: Cascade)
  review     Review?
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}

model Review {
  id        String   @id @default(uuid())
  orderId   String   @unique  // one review per order
  userId    String
  carId     String
  rating    Int
  comment   String?
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  car       Car      @relation(fields: [carId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

enum OrderStatus {
  PENDING
  CONFIRMED
  ACTIVE
  COMPLETED
  CANCELLED
}
```

**Relationships:**
- `User` 1:N `Order` — a user can place many orders
- `User` 1:N `Review` — a user can write many reviews
- `Car` 1:N `Order` — a car can be booked many times
- `Car` 1:N `Review` — a car can receive many reviews
- `Order` 1:1 `Review` — enforced via `@unique` on `orderId`

---

## Project Structure

```
car_showcase/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Role guard + responsive sidebar layout
│   │   ├── page.tsx            # Dashboard with period filter
│   │   ├── cars/
│   │   │   ├── page.tsx        # Car management table
│   │   │   ├── new/page.tsx    # Add car form
│   │   │   └── [id]/edit/page.tsx  # Edit car form
│   │   ├── orders/page.tsx     # Orders table + search
│   │   └── users/page.tsx      # User management + role control
│   ├── car-details/[id]/
│   │   └── page.tsx            # Car detail page
│   ├── featured/
│   │   └── page.tsx            # All featured cars with hero
│   ├── profile/
│   │   ├── layout.tsx          # Profile layout + order sync
│   │   ├── page.tsx            # User dashboard
│   │   ├── orders/
│   │   │   ├── page.tsx        # Orders center with tabs + filters
│   │   │   └── [id]/page.tsx   # Order detail + timeline
│   │   └── account/page.tsx    # Clerk UserProfile
│   ├── rent/page.tsx           # Booking form
│   ├── sign-in/[[...sign-in]]/
│   ├── sign-up/[[...sign-up]]/
│   ├── globals.css             # CSS variables, aurora, particles
│   ├── layout.tsx              # Root layout + theme script
│   └── page.tsx                # Homepage
│
├── components/
│   ├── admin/
│   │   ├── AdminNav.tsx        # Sidebar (desktop) + pill bar (mobile)
│   │   ├── CarForm.tsx         # Reusable add/edit car form
│   │   ├── CarTable.tsx        # Table (lg+) / cards (mobile)
│   │   ├── UserTable.tsx       # Table (lg+) / cards (mobile)
│   │   ├── SearchCars.tsx
│   │   ├── SearchOrders.tsx
│   │   └── SearchUsers.tsx
│   ├── CarCard.tsx             # Car card with featured badge
│   ├── CarFilters.tsx          # Client-side filter panel
│   ├── FeaturedCars.tsx        # Homepage featured section
│   ├── Hero.tsx                # Aurora hero + particles + stats
│   ├── Navbar.tsx              # Logo + theme toggle
│   ├── OrderCard.tsx
│   ├── OrderList.tsx           # useOptimistic cancel
│   ├── OrderProgress.tsx       # Status progress bar
│   ├── OrderTabs.tsx           # Tab switcher + sort
│   ├── OrderTimeline.tsx       # Vertical activity timeline
│   ├── RentForm.tsx            # Auth guard + booking form
│   ├── SearchableSelect.tsx    # Headless UI combobox
│   ├── ShowMore.tsx            # Pagination (hides when no more)
│   ├── StatusBadge.tsx         # Animated status pill
│   └── StatusUpdater.tsx       # Admin status dropdown
│
├── lib/
│   ├── prisma.ts               # Prisma singleton
│   ├── email.ts                # Lazy Resend init (build-safe)
│   ├── order-sync.ts           # Auto-advance order statuses
│   ├── sync-user.ts            # Clerk ↔ DB user sync
│   └── car-options.ts          # Dropdown arrays for car form
│
├── app/actions/
│   ├── admin.ts                # Car/order/user server actions
│   ├── order.ts                # Order CRUD + cancel
│   └── user.ts                 # User sync
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── config.ts
│
├── types/index.ts
├── constants/index.ts
└── tailwind.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Clerk](https://clerk.com) application
- A [Resend](https://resend.com) account (optional — emails are skipped gracefully if the key is absent)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/autoverse.git
cd autoverse

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in the values — see Environment Variables section below

# 4. Push the schema to your database
npx prisma db push

# 5. (Optional) Seed the database with sample cars
npx prisma db seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Making yourself an admin

After signing up through the app, open your Neon database console and run:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Then visit [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Environment Variables

Create a `.env.local` file in the root with the following:

```env
# ── Database (Neon) ──────────────────────────────
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"

# ── Clerk ────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# ── Email (optional) ─────────────────────────────
RESEND_API_KEY=re_...
```

> **Note:** The build will not fail if `RESEND_API_KEY` is missing. The Resend client is initialized lazily at runtime, so Vercel builds succeed even without the key.

---

## Key Engineering Decisions

**Why Server Components for data fetching?**
Fetching directly from Prisma in Server Components means zero client-side data fetching boilerplate, no loading spinners for initial data, and sensitive DB credentials never leave the server. The only trade-off is that interactive pages need a `"use client"` boundary, which is explicit and visible in the code.

**Why URL params as the filter source of truth?**
Keeping filter state in the URL instead of React state means filtered views are shareable, bookmarkable, and survive page refreshes without any extra persistence layer. It also makes the Back button work correctly for free.

**Why `useOptimistic` for admin toggles and order cancellation?**
Admin toggle switches (available, featured) and order cancellations feel instant because the UI updates immediately while the server action runs in the background. If the server action fails, React rolls back the optimistic state automatically.

**Why lazy Resend initialization?**
Initializing `new Resend(key)` at module load time would crash Vercel builds when `RESEND_API_KEY` is not set in the build environment. Lazy init (`if (!client) client = new Resend(key)`) defers this to runtime, where the key is always available.

**Why cookie-based theme instead of `localStorage`?**
`localStorage` is not accessible during server-side rendering, which means the theme can only be applied after hydration — causing a visible flash. A cookie is readable by the inline `<head>` script before the browser paints anything, eliminating the flash entirely.

---

## License

MIT — feel free to use this as a reference or starting point for your own projects.

---

*Built with Next.js, Prisma, PostgreSQL, Clerk, Tailwind CSS, and Resend.*
