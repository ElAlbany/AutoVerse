import { publicBranches } from "./branches";
import { selectedBranch } from "./stock-policy";
import "server-only";
import { prisma } from "./prisma";
import { freeUnitWhere } from "./inventory";
import type { ChatInput, ChatCar } from "./chat-policy";
export async function findChatInventory(input: ChatInput): Promise<ChatCar[]> {
  const branchId = input.branchId || selectedBranch(await publicBranches())?.id || "__no_active_branch__";
  const cars = await prisma.car.findMany({
    where: {
      branchId,
      available: true,
      archived: false,
      ...(input.passengers > 0 ? { seats: { gte: input.passengers } } : {}),
      units: {
        some: input.period
          ? freeUnitWhere(
              new Date(input.start!),
              new Date(input.end!),
              branchId,
            )
          : {
              enabled: true,
              branch: { active: true },
              branchId: branchId,
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
