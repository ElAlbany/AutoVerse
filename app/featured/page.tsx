import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import CarCard from "@/components/CarCard";
import Link from "next/link";

// Daily rates and listing state must reflect the current fleet, not build time.
export const dynamic = "force-dynamic";
export const metadata = { title: "Selected vehicles · AutoVerse" };

export default async function FeaturedPage() {
  const [cars, session] = await Promise.all([
    prisma.car.findMany({
      where: { featured: true, available: true, archived: false },
      orderBy: { createdAt: "desc" },
      take: 48,
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
  return (
    <main className="av-shell av-page">
      <p className="av-eyebrow">The AutoVerse selection</p>
      <h1>A few standouts.</h1>
      <p className="av-intro">
        A considered edit from our collection. Choose dates to check
        availability for your trip.
      </p>
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
                  reviewCount: rating?._count.id,
                  saved: favorites.some((f) => f.carId === car.id),
                }}
              />
            );
          })}
        </div>
      ) : (
        <div className="av-panel av-empty">
          <h2>The collection is being refreshed.</h2>
          <Link className="av-button mt-5" href="/#discover">
            Explore all cars
          </Link>
        </div>
      )}
    </main>
  );
}
