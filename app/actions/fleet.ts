"use server";
import { RentalError, runAction } from "@/lib/action-result";
import { parseFleetDateTime } from "@/lib/fleet-calendar";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { expireHolds, lockCar } from "@/lib/inventory";
import { bufferedEnd, validatePeriod } from "@/lib/rental-policy";
import { revalidatePath } from "next/cache";

export async function addVehicle(form: FormData) {
  return runAction(async () => {
    await requireAdmin();
    const branchId = String(form.get("branchId") || "");
    const carId = String(form.get("carId") || "");
    const code = String(form.get("code") || "").trim();
    if (!/^[a-zA-Z0-9-]{2,40}$/.test(code))
      throw new RentalError(
        "Use a unique fleet code with 2–40 letters, numbers or hyphens.",
      );
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, carId);
      await tx.car.findUniqueOrThrow({ where: { id: carId } });
      await tx.$queryRaw`SELECT id FROM "Branch" WHERE id = ${branchId} FOR SHARE`;
      if (
        !(await tx.branch.findFirst({ where: { id: branchId, active: true } }))
      )
        throw new RentalError("Choose an active branch.");
      await tx.vehicleUnit.create({ data: { carId, code, branchId } });
    });
    revalidatePath("/admin/fleet");
    revalidatePath("/");
  });
}

export async function setVehicleEnabled(form: FormData) {
  return runAction(async () => {
    await requireAdmin();
    const id = String(form.get("unitId"));
    const enabled = form.get("enabled") === "true";
    const unit = await prisma.vehicleUnit.findUniqueOrThrow({ where: { id } });
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, unit.carId);
      await expireHolds(tx, unit.carId);
      if (
        !enabled &&
        (await tx.vehicleReservation.count({
          where: {
            unitId: id,
            active: true,
            OR: [
              { endDate: { gt: new Date() } },
              { order: { status: "ACTIVE" } },
            ],
          },
        }))
      )
        throw new RentalError(
          "Reassign or finish upcoming reservations before taking this vehicle offline.",
        );
      await tx.vehicleUnit.update({ where: { id }, data: { enabled } });
    });
    revalidatePath("/admin/fleet");
    revalidatePath("/");
  });
}

export async function blockVehicle(form: FormData) {
  return runAction(async () => {
    await requireAdmin();
    const unitId = String(form.get("unitId"));
    const start = parseFleetDateTime(String(form.get("start"))),
      end = parseFleetDateTime(String(form.get("end")));
    validatePeriod(start, end);
    const reason = String(form.get("reason") || "Maintenance")
      .trim()
      .slice(0, 150);
    const unit = await prisma.vehicleUnit.findUniqueOrThrow({
      where: { id: unitId },
    });
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, unit.carId);
      await expireHolds(tx, unit.carId);
      if (
        await tx.vehicleReservation.count({
          where: {
            unitId,
            active: true,
            startDate: { lt: end },
            endDate: { gt: start },
          },
        })
      )
        throw new RentalError(
          "This maintenance period overlaps a rental or another block.",
        );
      await tx.vehicleReservation.create({
        data: { unitId, startDate: start, endDate: end, reason },
      });
    });
    revalidatePath("/admin/fleet");
    revalidatePath("/");
  });
}

export async function releaseBlock(form: FormData) {
  return runAction(async () => {
    await requireAdmin();
    const id = String(form.get("id"));
    const block = await prisma.vehicleReservation.findUniqueOrThrow({
      where: { id },
      include: { unit: true },
    });
    if (block.orderId)
      throw new RentalError(
        "Booking reservations must be changed through the order.",
      );
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, block.unit.carId);
      await tx.vehicleReservation.update({
        where: { id },
        data: { active: false },
      });
    });
    revalidatePath("/admin/fleet");
    revalidatePath("/");
  });
}

export async function assignVehicle(form: FormData) {
  return runAction(async () => {
    const admin = await requireAdmin();
    const orderId = String(form.get("orderId")),
      unitId = String(form.get("unitId"));
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
    });
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, order.carId);
      await expireHolds(tx, order.carId);
      const fresh = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      if (!["PENDING", "CONFIRMED", "ACTIVE"].includes(fresh.status))
        throw new RentalError(
          "Only upcoming or active rentals can be assigned.",
        );
      const unit = await tx.vehicleUnit.findFirst({
        where: {
          id: unitId,
          carId: order.carId,
          enabled: true,
          ...(fresh.branchId ? { branchId: fresh.branchId } : {}),
        },
      });
      if (!unit)
        throw new RentalError(
          "Choose an enabled vehicle belonging to the same listing and booked branch.",
        );
      if (
        await tx.vehicleReservation.count({
          where: {
            unitId,
            active: true,
            order: {
              id: { not: orderId },
              status: "ACTIVE",
              endDate: { lt: new Date() },
            },
          },
        })
      )
        throw new RentalError(
          "This vehicle has an overdue rental. Record its return before reassigning another booking to it.",
        );
      if (
        await tx.vehicleReservation.count({
          where: {
            unitId,
            active: true,
            OR: [{ orderId: null }, { orderId: { not: orderId } }],
            startDate: { lt: bufferedEnd(fresh.endDate) },
            endDate: { gt: fresh.startDate },
          },
        })
      )
        throw new RentalError("This vehicle has an overlapping reservation.");
      await tx.vehicleReservation.upsert({
        where: { orderId },
        create: {
          orderId,
          unitId,
          startDate: fresh.startDate,
          endDate: bufferedEnd(fresh.endDate),
        },
        update: { unitId, active: true },
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          inventoryConflict: false,
          branchId: fresh.branchId || unit.branchId,
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId,
          actorId: admin.id,
          message: "Staff reconciled the physical vehicle assignment.",
        },
      });
    });
    revalidatePath("/admin/fleet");
    revalidatePath("/admin/orders");
  });
}

export async function transferVehicle(form: FormData) {
  return runAction(async () => {
    await requireAdmin();
    const id = String(form.get("unitId"));
    const branchId = String(form.get("branchId"));
    const unit = await prisma.vehicleUnit.findUniqueOrThrow({ where: { id } });
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, unit.carId);
      await expireHolds(tx, unit.carId);
      await tx.$queryRaw`SELECT id FROM "Branch" WHERE id = ${branchId} FOR SHARE`;
      if (
        !(await tx.branch.findFirst({ where: { id: branchId, active: true } }))
      )
        throw new RentalError("Choose an active branch.");
      if (
        await tx.vehicleReservation.count({
          where: {
            unitId: id,
            active: true,
            OR: [
              { endDate: { gt: new Date() } },
              { order: { status: "ACTIVE" } },
            ],
          },
        })
      )
        throw new RentalError(
          "Finish or reassign all active and upcoming reservations before transferring a vehicle.",
        );
      await tx.vehicleUnit.update({ where: { id }, data: { branchId } });
    });
    revalidatePath("/admin/fleet");
    revalidatePath("/admin/branches");
    revalidatePath("/");
  });
}
