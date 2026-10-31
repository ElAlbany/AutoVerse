"use server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setFavorite(carId: string, saved: boolean) {
  const user = await requireUser();
  const car = await prisma.car.findFirst({
    where: { id: carId, archived: false },
    select: { id: true },
  });
  if (!car) throw new Error("Car not found.");
  if (saved)
    await prisma.favorite.upsert({
      where: { userId_carId: { userId: user.id, carId } },
      create: { userId: user.id, carId },
      update: {},
    });
  else await prisma.favorite.deleteMany({ where: { userId: user.id, carId } });
  revalidatePath("/profile/favorites");
}
