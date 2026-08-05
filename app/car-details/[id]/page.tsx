import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { generateCarImageUrl } from "@utils";

export default async function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const carRaw = await prisma.car.findUnique({
    where: { id },
  });

  if (!carRaw) return notFound();

  const car = {
    ...carRaw,
    pricePerDay: Number(carRaw.pricePerDay),
    createdAt: carRaw.createdAt.toISOString(),
  };

  const galleryAngles = [
    { angle: "29", label: "Front" },
    { angle: "33", label: "Side" },
    { angle: "13", label: "Rear" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-24 pb-16 transition-colors duration-500">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/"
            className="hover:text-primary-blue dark:hover:text-accent-cyan transition-colors"
          >
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium capitalize">
            {car.make} {car.model}
          </span>
        </div>
      </div>

      {/* Hero Section — Theme-aware, eye-comfort gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-[#0a0f1e] dark:via-[#111827] dark:to-[#1a2236] text-slate-900 dark:text-white transition-colors duration-500">
        {/* Subtle dot pattern — theme aware via currentColor */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        {/* Animated orbs — muted so they add depth without overwhelming */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-blue/10 dark:bg-white/5 rounded-full blur-3xl animate-pulse-glow" />
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 bg-accent-cyan/10 dark:bg-accent-cyan/20 rounded-full blur-3xl animate-pulse-glow"
          style={{ animationDelay: "2s" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-black/5 dark:bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold border border-black/10 dark:border-white/20 text-slate-700 dark:text-white">
                  {car.year}
                </span>
                <span className="px-3 py-1 bg-black/5 dark:bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold border border-black/10 dark:border-white/20 text-slate-700 dark:text-white capitalize">
                  {car.class}
                </span>
                {!car.available && (
                  <span className="px-3 py-1 bg-red-500/80 backdrop-blur-sm rounded-full text-xs font-semibold border border-red-400/30 text-white">
                    Unavailable
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold capitalize leading-tight">
                {car.make} <br />
                <span className="text-primary-blue dark:text-accent-cyan">
                  {car.model}
                </span>
              </h1>
              <p className="text-3xl sm:text-4xl font-bold">
                ${car.pricePerDay}
                <span className="text-lg text-slate-500 dark:text-blue-200 font-normal">
                  {" "}
                  /day
                </span>
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Badge
                  text={car.transmission === "a" ? "Automatic" : "Manual"}
                />
                <Badge text={car.drive.toUpperCase()} />
                <Badge text={car.fuel_type} />
                <Badge text={`${car.city_mpg} MPG`} />
              </div>
            </div>
            <div className="relative h-56 sm:h-72 lg:h-[28rem]">
              <Image
                src={generateCarImageUrl(car)}
                alt={`${car.make} ${car.model}`}
                fill
                className="object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 relative z-20">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-dark-border transition-all duration-500 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Gallery
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {galleryAngles.map(({ angle, label }) => (
                  <div
                    key={angle}
                    className="group relative aspect-[4/3] bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border cursor-pointer"
                  >
                    <Image
                      src={generateCarImageUrl(car, angle)}
                      alt={`${car.make} ${car.model} ${label} view`}
                      fill
                      className="object-contain p-3 sm:p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-xs font-medium text-center">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-dark-border transition-all duration-500 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                About this car
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {car.description ||
                  `The ${car.year} ${car.make} ${car.model} is a ${car.class} featuring a ${car.displacement}L ${car.cylinders}-cylinder engine. With ${car.city_mpg} MPG in the city and ${car.highway_mpg} MPG on the highway, it offers excellent fuel efficiency. The ${car.drive.toUpperCase()} drivetrain ensures a smooth and responsive driving experience.`}
              </p>
            </div>

            {/* Features Grid */}
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-dark-border transition-all duration-500 hover:shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Key Features
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <FeatureCard
                  icon="⛽"
                  title="Fuel Efficient"
                  desc={`${car.combination_mpg} MPG combined`}
                />
                <FeatureCard
                  icon="⚙️"
                  title="Engine"
                  desc={`${car.cylinders} Cyl ${car.displacement}L`}
                />
                <FeatureCard
                  icon="🛞"
                  title="Drivetrain"
                  desc={car.drive.toUpperCase()}
                />
                <FeatureCard
                  icon="🚗"
                  title="Transmission"
                  desc={car.transmission === "a" ? "Automatic" : "Manual"}
                />
                <FeatureCard
                  icon="📅"
                  title="Year"
                  desc={car.year.toString()}
                />
                <FeatureCard icon="🏷️" title="Class" desc={car.class} />
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Rent Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-dark-border lg:sticky lg:top-28 transition-all duration-500 hover:shadow-lg hover:border-primary-blue/20 dark:hover:border-primary-blue/30">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                Rental Info
              </h2>

              <div className="space-y-4 mb-6">
                {[
                  { label: "Daily Rate", value: `$${car.pricePerDay}` },
                  {
                    label: "Fuel Type",
                    value: car.fuel_type,
                    capitalize: true,
                  },
                  {
                    label: "Transmission",
                    value: car.transmission === "a" ? "Automatic" : "Manual",
                  },
                  { label: "Seats", value: "5 Persons" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between items-center py-3 border-b border-gray-50 dark:border-dark-border"
                  >
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {item.label}
                    </span>
                    <span
                      className={`font-bold text-gray-900 dark:text-gray-100 ${item.capitalize ? "capitalize" : ""}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-primary-blue/10 rounded-2xl p-4 mb-6 border border-blue-100 dark:border-primary-blue/20">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-primary-blue dark:text-accent-cyan"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                    Free Cancellation
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400/80">
                  Cancel anytime before pick-up for a full refund.
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-500 dark:text-gray-400">
                  Price per day
                </span>
                <span className="text-3xl font-bold text-gradient">
                  ${car.pricePerDay}
                </span>
              </div>

              {car.available ? (
                <Link
                  href={`/rent?carId=${car.id}`}
                  className="block w-full py-4 rounded-full bg-gradient-to-r from-primary-blue to-accent-cyan text-white font-bold text-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-blue/30 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Rent This Car
                </Link>
              ) : (
                <button
                  disabled
                  className="block w-full py-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-bold text-center cursor-not-allowed border border-gray-200 dark:border-gray-600"
                >
                  Currently Unavailable
                </button>
              )}

              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                {car.available
                  ? "Instant confirmation available"
                  : "This car is not available for rent"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="px-4 py-1.5 bg-black/5 dark:bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-black/10 dark:border-white/20 text-slate-700 dark:text-white transition-colors duration-300">
      {text}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 transition-all duration-300 hover:border-primary-blue/20 dark:hover:border-primary-blue/30 hover:shadow-md hover:-translate-y-1">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
          {title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
          {desc}
        </p>
      </div>
    </div>
  );
}
