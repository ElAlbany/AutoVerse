import "server-only";
import { prisma } from "./prisma";

export async function publicBranches(carId?: string) {
  return prisma.branch.findMany({
    where: {
      active: true,
      ...(carId ? { units: { some: { carId, enabled: true } } } : {}),
    },
    select: { id: true, name: true, city: true },
    orderBy: [{ city: "asc" }, { name: "asc" }],
  });
}
