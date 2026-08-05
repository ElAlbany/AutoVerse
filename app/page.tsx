import { prisma } from "@/lib/prisma";
import { CarCard, ShowMore, Hero, CarFilters } from "@components";
import { getOrCreateUser } from "@/lib/sync-user";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const manufacturer = (params.manufacturer as string) || "";
  const year = params.year ? Number(params.year) : undefined;
  const fuel = (params.fuel as string) || "";
  const limit = Number(params.limit) || 10;
  const model = (params.model as string) || "";
  const transmission = (params.transmission as string) || "";
  const drive = (params.drive as string) || "";
  const classType = (params.class as string) || "";

  const where: any = {};
  if (manufacturer)
    where.make = { contains: manufacturer, mode: "insensitive" };
  if (year) where.year = year;
  if (fuel) where.fuel_type = { equals: fuel, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };
  if (transmission)
    where.transmission = { equals: transmission, mode: "insensitive" };
  if (drive) where.drive = { equals: drive, mode: "insensitive" };
  if (classType) where.class = { equals: classType, mode: "insensitive" };

  const allCarsRaw = await prisma.car.findMany({
    where,
    take: limit + 1, // fetch one extra to detect "has more"
  });

  // Then determine if there's a next page:
  const hasMore = allCarsRaw.length > limit;

  // Slice off the extra car before displaying:
  const allCars = allCarsRaw.slice(0, limit).map((car) => ({
    ...car,
    pricePerDay: Number(car.pricePerDay),
    createdAt: car.createdAt.toISOString(),
  }));

  await getOrCreateUser();

  const isDataEmpty = !Array.isArray(allCars) || allCars.length < 1;

  return (
    <main className="overflow-hidden">
      <Hero />

      <div className="section-divider max-w-[1440px] mx-auto" />

      <div className="mt-12 padding-x padding-y max-width" id="discover">
        <div className="home__text-container">
          <h1 className="text-4xl font-extrabold">
            Car <span className="text-gradient">Catalogue</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Explore our curated collection of premium vehicles
          </p>
        </div>

        <div className="mt-8">
          <CarFilters totalResults={allCars.length} />
        </div>

        {!isDataEmpty ? (
          <section className="mt-8">
            <div className="home__cars-wrapper">
              {allCars?.map((car) => (
                <CarCard key={car.id} car={car as any} />
              ))}
            </div>

            <ShowMore pageNumber={limit / 10} isNext={hasMore} />
          </section>
        ) : (
          <div className="home__error-container mt-12">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Oops, no results
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters to see more cars
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
