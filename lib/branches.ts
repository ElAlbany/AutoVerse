import "server-only";
import { prisma } from "./prisma";

export async function publicBranches(carId?: string) {
  return prisma.branch.findMany({
    where: {
      active: true,
      ...(carId ? { cars: { some: { id: carId, archived: false } } } : {}),
    },
    select: { id: true, name: true, city: true },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });
}
