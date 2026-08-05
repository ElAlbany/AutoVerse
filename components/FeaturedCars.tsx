"use client";

import { CarCard } from "@components";
import Link from "next/link";

interface FeaturedCarsProps {
  cars: any[];
}

export default function FeaturedCars({ cars }: FeaturedCarsProps) {
  if (!cars || cars.length === 0) return null;

  const handleScrollToCatalogue = () => {
    const el = document.getElementById("discover");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mt-16 padding-x max-width" id="featured">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/30 mb-4">
            <svg
              className="w-4 h-4 text-amber-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Handpicked Selection
            </span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            Featured <span className="text-gradient">Vehicles</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
            Our top-tier selection of premium vehicles, curated for the ultimate
            driving experience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleScrollToCatalogue}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 hover:border-primary-blue/30 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            View Catalogue
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
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <Link
            href="/featured"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            View All Featured
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
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid 2xl:grid-cols-4 xl:grid-cols-3 md:grid-cols-2 grid-cols-1 w-full gap-8">
        {cars.map((car) => (
          <CarCard key={car.id} car={car as any} />
        ))}
      </div>

      {/* Mobile CTA */}
      <div className="flex flex-col sm:hidden items-center gap-3 mt-10">
        <Link
          href="/featured"
          className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg transition-all duration-300"
        >
          View All Featured
        </Link>
        <button
          onClick={handleScrollToCatalogue}
          className="px-8 py-3 rounded-full bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300"
        >
          View Catalogue
        </button>
      </div>
    </section>
  );
}
