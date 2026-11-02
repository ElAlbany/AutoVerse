"use server";
import { RentalError, runAction } from "@/lib/action-result";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setFavorite(carId: string, saved: boolean) {
  return runAction(async () => {
    const user = await requireUser();
    if (typeof carId !== "string" || !carId || carId.length > 100 || typeof saved !== "boolean")
      throw new RentalError("Invalid saved-car request.");
    const car = await prisma.car.findFirst({
      where: { id: carId, archived: false },
      select: { id: true },
    });
    if (!car) throw new RentalError("Car not found.");
    if (saved)
      await prisma.favorite.upsert({
        where: { userId_carId: { userId: user.id, carId } },
        create: { userId: user.id, carId },
        update: {},
      });
    else await prisma.favorite.deleteMany({ where: { userId: user.id, carId } });
    revalidatePath("/profile/favorites");
  });
}
