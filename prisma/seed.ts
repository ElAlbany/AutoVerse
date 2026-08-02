import { PrismaClient } from "@prisma/client";
import { mockCars } from "../utils/MockData";
import { calculateCarRent, generateCarImageUrl } from "../utils";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.car.count();
  if (count > 0) {
    console.log("Cars already seeded");
    return;
  }

  const carsToSeed = mockCars.map((car) => ({
    make: car.make,
    model: car.model,
    year: car.year,
    pricePerDay: Number(calculateCarRent(car.city_mpg, car.year)),
    fuel_type: car.fuel_type,
    transmission: car.transmission,
    drive: car.drive,
    city_mpg: car.city_mpg,
    class: car.class,
    combination_mpg: car.combination_mpg,
    cylinders: car.cylinders,
    displacement: car.displacement,
    highway_mpg: car.highway_mpg,
    images: [generateCarImageUrl(car)],
    description: `${car.year} ${car.make} ${car.model}`,
    available: true,
    featured: false,
  }));

  await prisma.car.createMany({ data: carsToSeed });
  console.log(`✅ Seeded ${carsToSeed.length} cars`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
