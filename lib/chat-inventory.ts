import "server-only";
import { prisma } from "./prisma";
import { freeUnitWhere } from "./inventory";
import type { ChatInput, ChatCar } from "./chat-policy";
export async function findChatInventory(input: ChatInput): Promise<ChatCar[]> {
  const cars = await prisma.car.findMany({
    where: {
      available: true,
      archived: false,
      ...(input.passengers > 0 ? { seats: { gte: input.passengers } } : {}),
      units: {
        some: input.period
          ? freeUnitWhere(
              new Date(input.start!),
              new Date(input.end!),
              input.branchId,
            )
          : {
              enabled: true,
              branch: { active: true },
              branchId: input.branchId,
            },
      },
    },
    orderBy: [{ pricePerDay: "asc" }, { id: "asc" }],
    take: 60,
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      pricePerDay: true,
      class: true,
      seats: true,
      luggage: true,
      transmission: true,
      features: true,
      usageTags: true,
      images: true,
      imageSource: true,
    },
  });
  return cars.map((car) => ({ ...car, pricePerDay: Number(car.pricePerDay) }));
}
