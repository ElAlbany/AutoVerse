import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Briefcase,
  Gauge,
  Fuel,
  ArrowUpRight,
  Star,
} from "lucide-react";
import VehicleImage from "@/components/VehicleImage";
import { carImage, hasCarPhoto } from "@/lib/car-media";
import { money } from "@/lib/rental-policy";
import ReportReview from "@/components/ReportReview";
import BookingSearch from "@/components/BookingSearch";
export default async function CarDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const car = await prisma.car.findFirst({
    where: { id, archived: false },
    include: {
      reviews: {
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { firstName: true } } },
      },
    },
  });
  if (!car) notFound();
  const stats = await prisma.review.aggregate({
    where: { carId: id, hidden: false },
    _avg: { rating: true },
    _count: { id: true },
  });
  const rentQuery = new URLSearchParams({ carId: id });
  if (query.start) rentQuery.set("start", query.start);
  if (query.end) rentQuery.set("end", query.end);
  return (
    <main className="av-shell av-page">
      <nav className="av-breadcrumb" aria-label="Breadcrumb">
        <Link href="/#discover">Our collection</Link>
        <span>
          / {car.make} {car.model}
        </span>
      </nav>
      <p className="av-eyebrow">
        {car.year} / {car.class}
      </p>
      <h1 className="capitalize">
        {car.make} {car.model}
      </h1>
      <div className="av-detail-meta">
        <span>
          <Users size={16} />
          {car.seats ? `${car.seats} seats` : "Seat capacity on request"}
        </span>
        <span>
          <Briefcase size={16} />
          {car.luggage != null
            ? `${car.luggage} bags`
            : "Luggage capacity on request"}
        </span>
        <span>
          <Gauge size={16} />
          {car.transmission === "a" ? "Automatic" : "Manual"}
        </span>
        <span>
          <Fuel size={16} />
          {car.fuel_type}
        </span>
        <a className="av-rating" href="#reviews">
          <Star size={15} />
          {stats._avg.rating?.toFixed(1) || "No reviews yet"}{" "}
          {stats._count.id > 0 && `(${stats._count.id} verified reviews)`}
        </a>
      </div>
      <div className="av-detail-layout">
        <div className="av-detail-content">
          <div className="av-detail-photo">
            <VehicleImage
              src={carImage(car)}
              alt={`${car.make} ${car.model}`}
              priority
              sizes="(max-width:760px) 100vw, 60vw"
            />
          </div>
          {!hasCarPhoto(car) && (
            <p className="av-muted">
              Illustration shown. Vehicle photographs are being prepared by the
              team.
            </p>
          )}
          <section className="av-details-section">
            <h2>A little more about your drive.</h2>
            <p>
              {car.description && car.description.length > 40
                ? car.description
                : `Explore the ${car.year} ${car.make} ${car.model}. Check the specifications and collection terms, then choose your dates to see whether a vehicle is available for your entire trip.`}
            </p>
          </section>
          {car.features.length > 0 && (
            <section className="av-details-section">
              <h2>The useful details.</h2>
              <ul>
                {car.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
            </section>
          )}
          <section className="av-details-section">
            <h2>Collection & rental terms.</h2>
            <p>
              Collection: {car.location}. A valid driving licence and
              identification are required. Mileage, protection, and any deposit
              are confirmed by the rental team before collection.
            </p>
            <p className="mt-3">
              Confirmed bookings can be cancelled more than 48 hours before
              pickup. Last-minute confirmed bookings cannot be cancelled.
              Unconfirmed requests can be withdrawn at any time.
            </p>
            <Link href="/rental-policy" className="av-text-link mt-4">
              Read the complete rental guide <ArrowUpRight size={16} />
            </Link>
          </section>
          <section
            id="reviews"
            className="av-details-section av-detail-reviews"
          >
            <h2>From the driver’s seat.</h2>
            <p>
              {stats._count.id
                ? `${stats._avg.rating?.toFixed(1)} / 5 from ${stats._count.id} verified rentals`
                : "No reviews yet. Reviews are available after completed rentals."}
            </p>
            {car.reviews.map((r) => (
              <article key={r.id}>
                <span className="av-rating">
                  {"★".repeat(r.rating)} · Verified rental
                </span>
                <p>{r.comment || "Rating only"}</p>
                <small>
                  {r.user.firstName || "AutoVerse driver"} ·{" "}
                  {r.createdAt.toLocaleDateString("en-GB")}
                  {r.updatedAt.getTime() - r.createdAt.getTime() > 60000
                    ? " · Edited"
                    : ""}
                </small>
                <div className="mt-3">
                  <ReportReview id={r.id} />
                </div>
              </article>
            ))}
            {stats._count.id > 20 && (
              <p className="av-muted mt-4">
                Showing the 20 most recent reviews.
              </p>
            )}
          </section>
        </div>
        <aside className="av-panel av-detail-sidebar">
          <p className="av-eyebrow">The next drive is yours</p>
          <p className="mt-5 mb-2">
            <strong className="text-4xl">
              {money(Number(car.pricePerDay))}
            </strong>
            <span className="av-muted"> / day</span>
          </p>
          <p className="av-muted">Starting daily rate · {car.location}</p>
          <hr className="my-6 border-[var(--border-color)]" />
          <p className="av-muted">
            Choose your dates for an exact quote and an availability check. One
            vehicle is allocated for the full trip.
          </p>
          {car.available ? (
            <Link href={`/rent?${rentQuery}`} className="av-button">
              Choose dates & continue <ArrowUpRight size={17} />
            </Link>
          ) : (
            <p className="av-alert">
              This listing is not accepting new bookings.
            </p>
          )}
          <p className="av-muted text-center mt-4">
            Browse freely. Sign in when you book.
          </p>
        </aside>
      </div>
    </main>
  );
}
