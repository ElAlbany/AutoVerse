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
    <main className="min-h-screen bg-gray-50 pt-28 pb-16">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary-blue transition-colors">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium capitalize">
            {car.make} {car.model}
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30">
                  {car.year}
                </span>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30 capitalize">
                  {car.class}
                </span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold capitalize leading-tight">
                {car.make} <br />
                <span className="text-blue-200">{car.model}</span>
              </h1>
              <p className="text-4xl font-bold">
                ${car.pricePerDay}
                <span className="text-lg text-blue-200 font-normal"> /day</span>
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
            <div className="relative h-72 lg:h-[28rem]">
              <Image
                src={generateCarImageUrl(car)}
                alt={`${car.make} ${car.model}`}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Gallery</h2>
              <div className="grid grid-cols-3 gap-4">
                {galleryAngles.map(({ angle, label }) => (
                  <div
                    key={angle}
                    className="group relative aspect-[4/3] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100"
                  >
                    <Image
                      src={generateCarImageUrl(car, angle)}
                      alt={`${car.make} ${car.model} ${label} view`}
                      fill
                      className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium text-center">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                About this car
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {car.description ||
                  `The ${car.year} ${car.make} ${car.model} is a ${car.class} featuring a ${car.displacement}L ${car.cylinders}-cylinder engine. With ${car.city_mpg} MPG in the city and ${car.highway_mpg} MPG on the highway, it offers excellent fuel efficiency. The ${car.drive.toUpperCase()} drivetrain ensures a smooth and responsive driving experience.`}
              </p>
            </div>

            {/* Features Grid */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Key Features
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100 sticky top-28">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Rental Info
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Daily Rate</span>
                  <span className="font-bold text-gray-900">
                    ${car.pricePerDay}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Fuel Type</span>
                  <span className="font-bold text-gray-900 capitalize">
                    {car.fuel_type}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Transmission</span>
                  <span className="font-bold text-gray-900">
                    {car.transmission === "a" ? "Automatic" : "Manual"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Seats</span>
                  <span className="font-bold text-gray-900">5 Persons</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 text-lg">✓</span>
                  <span className="text-sm font-semibold text-blue-900">
                    Free Cancellation
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Cancel anytime before pick-up for a full refund.
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-500">Price per day</span>
                <span className="text-3xl font-bold text-primary-blue">
                  ${car.pricePerDay}
                </span>
              </div>

              <Link
                href={`/rent?carId=${car.id}`}
                className="block w-full py-4 rounded-full bg-primary-blue text-white font-bold text-center transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Rent This Car
              </Link>

              <p className="text-center text-xs text-gray-400 mt-4">
                Instant confirmation available
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
    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/30">
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
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 capitalize">{desc}</p>
      </div>
    </div>
  );
}
