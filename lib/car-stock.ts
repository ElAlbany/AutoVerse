import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { RentalError } from "./action-result";
import { expireHolds, lockCar } from "./inventory";

type CarDetails = Omit<
  Prisma.CarUncheckedCreateInput,
  "id" | "branchId" | "quantity" | "units" | "orders" | "reviews" | "favorites"
>;

export async function saveBranchListing(input: {
  id?: string;
  branchId: string;
  quantity: number;
  data: CarDetails;
}) {
  if (
    !input.branchId ||
    !Number.isInteger(input.quantity) ||
    input.quantity < 0 ||
    input.quantity > 1000
  )
    throw new RentalError(
      "Choose a branch and a fleet quantity from 0 to 1,000.",
    );
  return prisma.$transaction(
    async (tx) => {
      if (input.id) await lockCar(tx, input.id);
      const previous = input.id
        ? await tx.car.findUniqueOrThrow({ where: { id: input.id } })
        : null;
      if (previous && previous.branchId !== input.branchId)
        throw new RentalError(
          "A listing belongs to one branch. Add a separate listing to offer this model at another branch.",
        );
      await tx.$queryRaw`SELECT id FROM "Branch" WHERE id = ${input.branchId} FOR SHARE`;
      const branch = await tx.branch.findUnique({
        where: { id: input.branchId },
      });
      if (!branch || (!previous && !branch.active))
        throw new RentalError("Choose an active collection branch.");
      if (previous) {
        await expireHolds(tx, previous.id);
        if (
          input.data.available &&
          (await tx.order.count({
            where: {
              carId: previous.id,
              inventoryConflict: true,
              status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
            },
          }))
        )
          throw new RentalError(
            "Resolve legacy assignments in Fleet before enabling this listing.",
          );
      }
      const car = previous
        ? await tx.car.update({
            where: { id: previous.id },
            data: { ...input.data, location: branch.name },
          })
        : await tx.car.create({
            data: {
              ...input.data,
              id: randomUUID(),
              branchId: branch.id,
              location: branch.name,
            },
          });
      const quantity = await tx.vehicleUnit.count({
        where: { carId: car.id, enabled: true },
      });
      const unreserved: Prisma.VehicleUnitWhereInput = {
        carId: car.id,
        reservations: {
          none: {
            active: true,
            OR: [
              { endDate: { gt: new Date() } },
              { order: { status: "ACTIVE" } },
            ],
          },
        },
      };
      if (input.quantity < quantity) {
        const units = await tx.vehicleUnit.findMany({
          where: { ...unreserved, enabled: true },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: quantity - input.quantity,
          select: { id: true },
        });
        if (units.length !== quantity - input.quantity)
          throw new RentalError(
            "This quantity would remove vehicles with active or upcoming bookings, maintenance or preparation. Resolve those reservations first.",
          );
        await tx.vehicleUnit.updateMany({
          where: { id: { in: units.map((unit) => unit.id) } },
          data: { enabled: false },
        });
      } else if (input.quantity > quantity) {
        const needed = input.quantity - quantity;
        const reusable = await tx.vehicleUnit.findMany({
          where: { ...unreserved, enabled: false },
          select: { id: true },
          take: needed,
          orderBy: { id: "asc" },
        });
        if (reusable.length)
          await tx.vehicleUnit.updateMany({
            where: { id: { in: reusable.map((unit) => unit.id) } },
            data: { enabled: true },
          });
        const additional = needed - reusable.length;
        if (additional)
          await tx.vehicleUnit.createMany({
            data: Array.from({ length: additional }, () => ({
              carId: car.id,
              branchId: branch.id,
              code: `AV-${randomUUID().slice(0, 16)}`,
            })),
          });
      }
      return tx.car.findUniqueOrThrow({ where: { id: car.id } });
    },
    { maxWait: 10000, timeout: 20000 },
  );
}
