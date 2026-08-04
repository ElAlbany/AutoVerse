import { prisma } from "@/lib/prisma";
import { fuels, yearsOfProduction } from "@constants";
import { CarCard, ShowMore, SearchBar, CustomFilter, Hero } from "@components";
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

  const where: any = {};
  if (manufacturer)
    where.make = { contains: manufacturer, mode: "insensitive" };
  if (year) where.year = year;
  if (fuel) where.fuel_type = { equals: fuel, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };

  const allCarsRaw = await prisma.car.findMany({
    where,
    take: limit,
  });

  // Convert Decimal and Date to plain types for client components
  const allCars = allCarsRaw.map((car) => ({
    ...car,
    pricePerDay: Number(car.pricePerDay),
    createdAt: car.createdAt.toISOString(),
  }));

  await getOrCreateUser();

  const isDataEmpty = !Array.isArray(allCars) || allCars.length < 1;

  return (
    <main className="overflow-hidden">
      <Hero />

      {/* Section Divider */}
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

        <div className="home__filters">
          <SearchBar />

          <div className="home__filter-container">
            <CustomFilter title="fuel" options={fuels} />
            <CustomFilter title="year" options={yearsOfProduction} />
          </div>
        </div>

        {!isDataEmpty ? (
          <section>
            <div className="home__cars-wrapper">
              {allCars?.map((car) => (
                <CarCard key={car.id} car={car as any} />
              ))}
            </div>

            <ShowMore pageNumber={limit / 10} isNext={limit > allCars.length} />
          </section>
        ) : (
          <div className="home__error-container">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Oops, no results
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
