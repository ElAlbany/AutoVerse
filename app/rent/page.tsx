import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RentForm from "@/components/RentForm";
import Image from "next/image";
import Link from "next/link";

export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const carId = params.carId;

  if (!carId) return notFound();

  const carRaw = await prisma.car.findUnique({
    where: { id: carId },
  });

  if (!carRaw) return notFound();

  const car = {
    ...carRaw,
    pricePerDay: Number(carRaw.pricePerDay),
    createdAt: carRaw.createdAt.toISOString(),
  };

  const carImage = car.images?.[0] || "/hero.png";

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-24 pb-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 flex-wrap">
          <Link
            href="/"
            className="hover:text-primary-blue dark:hover:text-accent-cyan transition-colors"
          >
            Catalogue
          </Link>
          <span>/</span>
          <Link
            href={`/car-details/${car.id}`}
            className="hover:text-primary-blue dark:hover:text-accent-cyan transition-colors capitalize"
          >
            {car.make} {car.model}
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            Rent
          </span>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left: Car Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border transition-all duration-500 hover:shadow-lg">
              <div className="relative w-full aspect-[4/3] bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden mb-6">
                <Image
                  src={carImage}
                  alt={`${car.make} ${car.model}`}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                {car.year} {car.make} {car.model}
              </h1>
              <p className="text-primary-blue dark:text-accent-cyan font-bold text-xl mt-2">
                ${car.pricePerDay}
                <span className="text-gray-400 dark:text-gray-500 text-sm font-normal">
                  {" "}
                  /day
                </span>
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <SpecItem
                  icon="⚙️"
                  label="Transmission"
                  value={car.transmission === "a" ? "Automatic" : "Manual"}
                />
                <SpecItem
                  icon="🛞"
                  label="Drive"
                  value={car.drive.toUpperCase()}
                />
                <SpecItem icon="⛽" label="Fuel Type" value={car.fuel_type} />
                <SpecItem
                  icon="📊"
                  label="City MPG"
                  value={`${car.city_mpg} MPG`}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-primary-blue/10 rounded-3xl p-6 border border-blue-100 dark:border-primary-blue/20">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Rental Policy
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-400/80 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue dark:text-accent-cyan mt-0.5">
                    •
                  </span>
                  Free cancellation before 48 hours from pick-up date
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue dark:text-accent-cyan mt-0.5">
                    •
                  </span>
                  Refund only before 48 hours from pick-up date
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue dark:text-accent-cyan mt-0.5">
                    •
                  </span>
                  Full insurance included
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue dark:text-accent-cyan mt-0.5">
                    •
                  </span>
                  24/7 roadside assistance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-blue dark:text-accent-cyan mt-0.5">
                    •
                  </span>
                  Mileage limit: 300 miles/day
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-dark-border transition-all duration-500 hover:shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Booking Details
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Select your rental period to get started.
              </p>
              <RentForm car={car} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 transition-all duration-300 hover:border-primary-blue/20 dark:hover:border-primary-blue/30">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
          {value}
        </p>
      </div>
    </div>
  );
}
