import "server-only";
import { OrderStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { RentalError } from "./action-result";
import { lockCar, expireHolds } from "./inventory";
import { bufferedEnd } from "./rental-policy";
import { queueOrderEmail } from "./notifications";
import { refundOrder } from "./payments";
const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
export async function transitionRental(
  orderId: string,
  status: string,
  actorId: string,
  effects: { refund?: (id: string) => Promise<void> } = {},
) {
  if (!Object.values(OrderStatus).includes(status as OrderStatus))
    throw new RentalError("Invalid status.");
  if (
    !(await prisma.user.findFirst({
      where: { id: actorId, role: "ADMIN" },
      select: { id: true },
    }))
  )
    throw new RentalError("Administrator access required.");
  const found = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, found.carId);
    await expireHolds(tx, found.carId);
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { reservation: { include: { unit: true } } },
    });
    if (status === order.status) return;
    if (!TRANSITIONS[order.status]?.includes(status))
      throw new RentalError("This status change is not allowed.");
    if (["CONFIRMED", "ACTIVE"].includes(status)) {
      if (
        order.inventoryConflict ||
        !order.reservation?.active ||
        !order.reservation.unit.enabled
      )
        throw new RentalError(
          "Resolve the vehicle assignment in Fleet before confirming this rental.",
        );
      if (
        (order.policy as { payment?: string } | null)?.payment ===
          "stripe-sandbox" &&
        order.paymentStatus !== "PAID"
      )
        throw new RentalError(
          "Sandbox checkout must be paid before confirmation.",
        );
      if (status === "CONFIRMED" && order.endDate <= new Date())
        throw new RentalError("An expired rental cannot be confirmed.");
      if (status === "ACTIVE" && order.endDate <= new Date())
        throw new RentalError(
          "This rental period has ended. Arrange new dates before recording collection.",
        );
      if (status === "ACTIVE" && order.startDate > new Date())
        throw new RentalError(
          "Collection cannot be recorded before the scheduled pickup time.",
        );
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus,
        expiresAt: null,
        inventoryConflict:
          status === "CANCELLED" ? false : order.inventoryConflict,
        paymentStatus:
          status === "CANCELLED" && order.paymentStatus === "PAID"
            ? "REFUND_PENDING"
            : order.paymentStatus,
      },
    });
    if (status === "CANCELLED")
      await tx.vehicleReservation.updateMany({
        where: { orderId },
        data: { active: false },
      });
    if (status === "COMPLETED" && !order.reservation?.active)
      throw new RentalError(
        "Resolve the vehicle assignment before recording a return.",
      );
    if (status === "COMPLETED" && order.reservation) {
      const returned = new Date();
      const preparationEnd = bufferedEnd(returned);
      if (
        await tx.vehicleReservation.count({
          where: {
            unitId: order.reservation.unitId,
            active: true,
            OR: [{ orderId: null }, { orderId: { not: orderId } }],
            startDate: { lt: preparationEnd },
            endDate: { gt: returned },
          },
        })
      )
        throw new RentalError(
          "Return preparation overlaps the next reservation. Reassign that booking in Fleet before recording this return.",
        );
      if (preparationEnd > order.reservation.startDate)
        await tx.vehicleReservation.update({
          where: { orderId },
          data: { endDate: preparationEnd },
        });
    }
    await tx.orderEvent.create({
      data: {
        orderId,
        actorId,
        message:
          status === "ACTIVE"
            ? "Vehicle collection recorded by staff."
            : status === "COMPLETED"
              ? "Vehicle return recorded by staff. A verified review is now available."
              : `Rental ${status.toLowerCase()} by staff.`,
      },
    });
    await queueOrderEmail(tx, orderId);
  });
  try {
    await (effects.refund || refundOrder)(orderId);
  } catch {
    /* Queued refunds are retried by maintenance. */
  }
}
