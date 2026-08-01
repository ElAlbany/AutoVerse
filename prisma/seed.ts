import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cars = [
    {
      make: "Toyota",
      model: "Corolla",
      year: 2023,
      pricePerDay: 52.0,
      fuelType: "Gas",
      transmission: "Automatic",
      capacity: 5,
      images: [
        "https://cdn.imagin.studio/getimage?customer=img&make=toyota&modelFamily=corolla",
      ],
      description: "Reliable and fuel-efficient sedan",
      available: true,
      featured: true,
    },
    {
      make: "BMW",
      model: "3 Series",
      year: 2023,
      pricePerDay: 85.0,
      fuelType: "Gas",
      transmission: "Automatic",
      capacity: 5,
      images: [
        "https://cdn.imagin.studio/getimage?customer=img&make=bmw&modelFamily=3-series",
      ],
      description: "Luxury sports sedan",
      available: true,
      featured: true,
    },
    {
      make: "Tesla",
      model: "Model 3",
      year: 2023,
      pricePerDay: 95.0,
      fuelType: "Electric",
      transmission: "Automatic",
      capacity: 5,
      images: [
        "https://cdn.imagin.studio/getimage?customer=img&make=tesla&modelFamily=model-3",
      ],
      description: "All-electric premium sedan",
      available: true,
      featured: true,
    },
  ];

  for (const car of cars) {
    await prisma.car.create({ data: car });
  }

  console.log("✅ Seeded 3 cars");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
