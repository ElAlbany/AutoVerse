import { PrismaClient } from "@prisma/client";
import { mockCars } from "../utils/MockData";
import { calculateCarRent, generateCarImageUrl } from "../utils";
import { CarProps } from "@/types";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.car.count();
  if (count > 0) {
    console.log("Cars already seeded");
    return;
  }

  await prisma.branch.upsert({
    where: { id: "branch-main" },
    create: {
      id: "branch-main",
      name: "Main collection point",
      city: "Main collection point",
    },
    update: {},
  });
  // Demonstration configurations only: verify the actual trim before operating.
  const demoSeats: Record<string, number> = {
    "acura mdx": 7,
    "audi q7": 7,
    "ford explorer": 7,
    "gmc acadia": 6,
    "kia telluride": 8,
    "mitsubishi outlander": 7,
  };
  const carsToSeed = mockCars.map((car) => ({
    make: car.make,
    model: car.model,
    year: car.year,
    seats: demoSeats[`${car.make} ${car.model}`.toLowerCase()] || 5,
    usageTags: car.class.toLowerCase().includes("truck")
      ? ["INTERCITY"]
      : ["CITY", "INTERCITY"],
    imageSource: "API",
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
    images: [
      generateCarImageUrl({
        ...car,
        available: true,
        featured: false,
      } as CarProps),
    ],
    description: `${car.year} ${car.make} ${car.model}`,
    available: true,
    featured: false,
  }));

  await prisma.car.createMany({ data: carsToSeed });
  const cars = await prisma.car.findMany({ select: { id: true } });
  await prisma.vehicleUnit.createMany({
    data: cars.map((car) => ({
      carId: car.id,
      code: `AV-${car.id}`,
      branchId: "branch-main",
    })),
  });
  console.log(
    `Seeded ${carsToSeed.length} cars and one initial unit per listing.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
