import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Hero from "@/components/Hero";
import CarCard from "@/components/CarCard";
import BookingSearch from "@/components/BookingSearch";
import { freeUnitWhere } from "@/lib/inventory";
import { quoteRental, validatePeriod } from "@/lib/rental-policy";
import { ArrowUpRight, CalendarDays, KeyRound, Route } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const value = (key: string) =>
    typeof raw[key] === "string" ? (raw[key] as string) : "";
  const search = value("search").slice(0, 100),
    category = value("class"),
    sort = value("sort");
  const page = Math.max(
    1,
    Math.min(10000, Math.floor(Number(value("page")) || 1)),
  );
  const pageSize = 12;
  const offset = (page - 1) * pageSize;
  const start = new Date(value("start")),
    end = new Date(value("end"));
  let period = false;
  let error = "";
  if (value("start") || value("end")) {
    try {
      validatePeriod(start, end);
      period = true;
    } catch (e) {
      error = e instanceof Error ? e.message : "Choose a valid rental period.";
    }
  }
  const where: Prisma.CarWhereInput = { archived: false };
  if (search)
    where.OR = [
      { make: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  if (category) where.class = { contains: category, mode: "insensitive" };
  if (value("fuel"))
    where.fuel_type = { equals: value("fuel"), mode: "insensitive" };
  if (value("transmission")) where.transmission = value("transmission");
  if (value("location"))
    where.location = {
      contains: value("location").slice(0, 100),
      mode: "insensitive",
    };
  const seats = Number(value("seats"));
  if (Number.isInteger(seats) && seats > 0) where.seats = { gte: seats };
  const min = Number(value("minPrice")),
    max = Number(value("maxPrice"));
  if (
    (value("minPrice") && Number.isFinite(min)) ||
    (value("maxPrice") && Number.isFinite(max))
  )
    where.pricePerDay = {
      ...(value("minPrice") && Number.isFinite(min) && min >= 0
        ? { gte: min }
        : {}),
      ...(value("maxPrice") && Number.isFinite(max) && max >= 0
        ? { lte: max }
        : {}),
    };
  if (period) {
    where.available = true;
    where.units = { some: freeUnitWhere(start, end) };
  }
  const [cars, total, latestReviews, session] = await Promise.all([
    prisma.car.findMany({
      where,
      orderBy:
        sort === "price-low"
          ? [{ pricePerDay: "asc" }, { id: "asc" }]
          : sort === "price-high"
            ? [{ pricePerDay: "desc" }, { id: "asc" }]
            : [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }],
      take: pageSize,
      skip: offset,
      include: {
        _count: {
          select: {
            units: {
              where: period ? freeUnitWhere(start, end) : { enabled: true },
            },
          },
        },
      },
    }),
    prisma.car.count({ where }),
    prisma.review.findMany({
      where: { hidden: false, comment: { not: "" } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: {
        user: { select: { firstName: true } },
        car: { select: { make: true, model: true } },
      },
    }),
    auth(),
  ]);
  const [ratings, favorites] = await Promise.all([
    prisma.review.groupBy({
      by: ["carId"],
      where: { carId: { in: cars.map((c) => c.id) }, hidden: false },
      _avg: { rating: true },
      _count: { id: true },
    }),
    session.userId
      ? prisma.favorite.findMany({
          where: { user: { clerkId: session.userId } },
          select: { carId: true },
        })
      : Promise.resolve([]),
  ]);
  const query = new URLSearchParams();
  for (const [key, v] of Object.entries(raw))
    if (typeof v === "string") query.set(key, v);
  const bookingQuery = period
    ? `?${new URLSearchParams({ start: start.toISOString(), end: end.toISOString() })}`
    : "";
  const more = new URLSearchParams(query);
  more.delete("limit");
  more.set("page", String(page + 1));
  const previous = new URLSearchParams(query);
  previous.delete("limit");
  previous.set("page", String(page - 1));
  return (
    <main>
      <Hero
        start={value("start")}
        end={value("end")}
        location={value("location")}
      />
      <div className="av-promise-strip av-shell">
        <span>
          01 <strong>A car for your plans</strong>
        </span>
        <span>
          02 <strong>Dates checked before booking</strong>
        </span>
        <span>
          03 <strong>Clear terms, from the start</strong>
        </span>
      </div>
      <section id="discover" className="av-shell av-collection">
        <div className="av-section-heading">
          <div>
            <p className="av-eyebrow">The AutoVerse collection</p>
            <h2>Find your kind of drive.</h2>
          </div>
          <p>
            City days. Open roads. A little more room.
            <br />
            Choose what fits the way you travel.
          </p>
        </div>
        {(value("start") || value("end")) && (
          <BookingSearch
            start={value("start")}
            end={value("end")}
            location={value("location")}
          />
        )}
        {error && (
          <p className="av-alert" role="alert">
            {error}
          </p>
        )}
        <form className="av-filter-bar" action="/#discover">
          <input type="hidden" name="start" value={value("start")} />
          <input type="hidden" name="end" value={value("end")} />
          <input type="hidden" name="location" value={value("location")} />
          <label className="sr-only" htmlFor="car-search">
            Search cars
          </label>
          <input
            id="car-search"
            name="search"
            defaultValue={search}
            placeholder="Make, model, or a little inspiration…"
          />
          <label>
            <span className="sr-only">Category</span>
            <select name="class" defaultValue={category}>
              <option value="">All categories</option>
              {[
                "SUV",
                "Car",
                "Coupe",
                "Convertible",
                "Van",
                "Truck",
                "Wagon",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Transmission</span>
            <select name="transmission" defaultValue={value("transmission")}>
              <option value="">Any transmission</option>
              <option value="a">Automatic</option>
              <option value="m">Manual</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort cars</span>
            <select name="sort" defaultValue={sort}>
              <option value="">Our selection</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
          <button className="av-button av-button-small">Apply</button>
          <details className="av-more-filters">
            <summary>More filters</summary>
            <div>
              <label>
                Minimum seats
                <input
                  type="number"
                  name="seats"
                  min="1"
                  max="20"
                  defaultValue={value("seats")}
                />
              </label>
              <label>
                Daily budget from
                <input
                  type="number"
                  name="minPrice"
                  min="0"
                  defaultValue={value("minPrice")}
                />
              </label>
              <label>
                Daily budget to
                <input
                  type="number"
                  name="maxPrice"
                  min="0"
                  defaultValue={value("maxPrice")}
                />
              </label>
              <label>
                Fuel
                <select name="fuel" defaultValue={value("fuel")}>
                  <option value="">Any fuel</option>
                  <option value="gas">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electricity">Electric</option>
                </select>
              </label>
            </div>
          </details>
        </form>
        <div className="av-results-line">
          <span>
            {total} {total === 1 ? "car" : "cars"}
            {period ? " available for your dates" : " in the collection"}
          </span>
          <div>
            <Link href="/compare">Compare shortlist</Link>
            {query.size > 0 && <Link href="/#discover">Clear filters</Link>}
          </div>
        </div>
        {cars.length ? (
          <div className="av-car-grid">
            {cars.map((car) => {
              const rating = ratings.find((r) => r.carId === car.id);
              return (
                <CarCard
                  key={car.id}
                  car={{
                    ...car,
                    pricePerDay: Number(car.pricePerDay),
                    rating: rating?._avg.rating,
                    reviewCount: rating?._count.id || 0,
                    saved: favorites.some((f) => f.carId === car.id),
                    availableCount: period ? car._count.units : undefined,
                    tripTotal: period
                      ? quoteRental(Number(car.pricePerDay), start, end).total
                      : undefined,
                    bookingQuery,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="av-panel av-empty">
            <h3>A different route, perhaps?</h3>
            <p>
              No cars match this combination. Try another date, a wider budget,
              or fewer filters.
            </p>
            <Link href="/#discover" className="av-button">
              Reset your search
            </Link>
          </div>
        )}
        {(total > offset + pageSize || page > 1) && (
          <div className="av-load-more">
            {page > 1 && (
              <Link
                className="av-button av-button-outline"
                href={`/?${previous}#discover`}
              >
                Previous cars
              </Link>
            )}
            <span className="av-muted px-5">
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </span>
            {total > offset + pageSize && (
              <Link
                className="av-button av-button-outline"
                href={`/?${more}#discover`}
              >
                Next cars <ArrowUpRight size={18} />
              </Link>
            )}
          </div>
        )}
      </section>
      <section className="av-how" id="how-it-works">
        <div className="av-shell">
          <div className="av-section-heading">
            <div>
              <p className="av-eyebrow">Less to think about</p>
              <h2>Your plans. Three simple steps.</h2>
            </div>
            <Link className="av-text-link" href="/how-it-works">
              The rental guide <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="av-steps">
            {[
              {
                icon: CalendarDays,
                n: "01",
                title: "Make a little space",
                text: "Choose your dates. We check which vehicles can be yours for the entire trip.",
              },
              {
                icon: KeyRound,
                n: "02",
                title: "Choose your companion",
                text: "Compare the details, read the terms, and sign in when you’re ready to book.",
              },
              {
                icon: Route,
                n: "03",
                title: "Take the long way",
                text: "Find your confirmed rental and collection instructions together in your account.",
              },
            ].map((s) => (
              <div key={s.n}>
                <div>
                  <s.icon size={23} />
                  <span>{s.n}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="av-shell av-reviews-section">
        <p className="av-eyebrow">From the driver’s seat</p>
        <h2>Good journeys leave a story.</h2>
        {latestReviews.length ? (
          <div className="av-review-grid">
            {latestReviews.map((r) => (
              <blockquote key={r.id}>
                <span className="av-rating">
                  {"★".repeat(r.rating)} · Verified rental
                </span>
                <p>{r.comment || "A rated AutoVerse rental."}</p>
                <footer>
                  {r.user.firstName || "AutoVerse driver"}
                  <small>
                    {r.car.make} {r.car.model}
                  </small>
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="av-review-empty">
            <p>Our next chapter starts with you.</p>
            <span>
              Verified reviews will appear here after completed rentals. Every
              story comes from a real booking.
            </span>
          </div>
        )}
      </section>
      <section className="av-shell av-faq">
        <div>
          <p className="av-eyebrow">Before you set off</p>
          <h2>A few good questions.</h2>
        </div>
        <div>
          {[
            [
              "Can I browse without an account?",
              "Absolutely. Explore, compare, and check availability freely. Sign in when you book, save a car, or contribute a review.",
            ],
            [
              "Is a particular model guaranteed?",
              "Your booking is for the selected listing. A physical vehicle is allocated for your full rental period before the booking can be confirmed.",
            ],
            [
              "What if my plans change?",
              "You can withdraw an unconfirmed request at any time. Confirmed bookings can be cancelled more than 48 hours before pickup. Eligible sandbox payments are refunded.",
            ],
            [
              "Will I be charged real money?",
              "This edition uses Stripe sandbox payments only. Where payments are not configured, send a booking request for the team to review.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span>+</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
