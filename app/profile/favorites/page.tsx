import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CarCard from "@/components/CarCard";
import Link from "next/link";
export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id, car: { archived: false } },
    include: { car: true },
    take: 100,
  });
  return (
    <div>
      <p className="av-eyebrow">Your collection</p>
      <h1 className="text-3xl mb-6">Saved for the next drive.</h1>
      {favorites.length ? (
        <div className="av-car-grid av-car-grid-small">
          {favorites.map(({ car }) => (
            <CarCard
              key={car.id}
              car={{
                ...car,
                pricePerDay: Number(car.pricePerDay),
                saved: true,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="av-panel">
          <p>Your saved cars will appear here.</p>
          <Link className="av-text-link" href="/#discover">
            Explore the collection →
          </Link>
        </div>
      )}
    </div>
  );
}
