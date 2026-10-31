import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { queueOrderEmail } from "./notifications";
import { bufferedEnd } from "./rental-policy";

export async function lockCar(tx: Prisma.TransactionClient, carId: string) {
  // A row lock serializes fleet changes for this listing across all app instances.
  await tx.$queryRaw`SELECT id FROM "Car" WHERE id = ${carId} FOR UPDATE`;
}

export async function expireHolds(
  tx: Prisma.TransactionClient,
  carId?: string
) {
  const expired = await tx.order.findMany({
    where: {
      carId,
      status: "PENDING",
      paymentStatus: "UNPAID",
      expiresAt: { lte: new Date() },
    },
    select: { id: true },
  });
  if (!expired.length) return;
  const ids = expired.map((o) => o.id);
  await tx.vehicleReservation.updateMany({
    where: { orderId: { in: ids } },
    data: { active: false },
  });
  await tx.order.updateMany({
    where: { id: { in: ids }, status: "PENDING", paymentStatus: "UNPAID" },
    data: { status: "CANCELLED" },
  });
  await tx.orderEvent.createMany({
    data: ids.map((orderId) => ({
      orderId,
      message:
        "The unconfirmed hold expired. Start a new booking to check availability.",
    })),
  });
  for (const orderId of ids) await queueOrderEmail(tx, orderId);
}

export function freeUnitWhere(
  start: Date,
  end: Date
): Prisma.VehicleUnitWhereInput {
  return {
    enabled: true,
    NOT: {
      reservations: {
        some: {
          active: true,
          order: { status: "ACTIVE", endDate: { lt: new Date() } },
        },
      },
    },
    reservations: {
      none: {
        active: true,
        startDate: { lt: bufferedEnd(end) },
        endDate: { gt: start },
        OR: [
          { orderId: null },
          { order: { status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } } },
          {
            order: {
              status: "PENDING",
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        ],
      },
    },
  };
}

export async function availableUnits(carId: string, start: Date, end: Date) {
  return prisma.vehicleUnit.count({
    where: {
      carId,
      car: { archived: false, available: true },
      ...freeUnitWhere(start, end),
    },
  });
}
