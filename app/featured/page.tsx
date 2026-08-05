import { prisma } from "@/lib/prisma";
import { CarCard } from "@components";
import Link from "next/link";

export default async function FeaturedPage() {
  const featuredCarsRaw = await prisma.car.findMany({
    where: {
      featured: true,
      available: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const featuredCars = featuredCarsRaw.map((car) => ({
    ...car,
    pricePerDay: Number(car.pricePerDay),
    createdAt: car.createdAt.toISOString(),
  }));

  return (
    <main className="overflow-hidden min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 padding-x max-width">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 mb-6">
            <svg
              className="w-4 h-4 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Premium Selection
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
            Featured <span className="text-gradient">Vehicles</span>
          </h1>

          <p className="text-lg text-gray-500 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Our complete collection of handpicked premium vehicles, curated for
            those who demand excellence in every drive.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span className="px-4 py-2 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm font-semibold text-gray-700 dark:text-gray-300">
              {featuredCars.length} Vehicle
              {featuredCars.length !== 1 ? "s" : ""}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider max-w-[1440px] mx-auto" />

      {/* Cars Grid */}
      <section className="py-16 padding-x max-width">
        {featuredCars.length > 0 ? (
          <div className="grid 2xl:grid-cols-4 xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400 dark:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No featured vehicles yet
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Check back soon for our premium selection.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
