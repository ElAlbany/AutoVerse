"use server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { expireHolds, lockCar } from "@/lib/inventory";
import { bufferedEnd, validatePeriod } from "@/lib/rental-policy";
import { revalidatePath } from "next/cache";

export async function addVehicle(form: FormData) {
  const admin = await requireAdmin();
  const carId = String(form.get("carId") || "");
  const code = String(form.get("code") || "").trim();
  if (!/^[a-zA-Z0-9-]{2,40}$/.test(code))
    throw new Error(
      "Use a unique fleet code with 2–40 letters, numbers or hyphens."
    );
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, carId);
    await tx.car.findUniqueOrThrow({ where: { id: carId } });
    await tx.vehicleUnit.create({ data: { carId, code } });
  });
  revalidatePath("/admin/fleet");
  revalidatePath("/");
}

export async function setVehicleEnabled(form: FormData) {
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
        where: { unitId: id, active: true, endDate: { gt: new Date() } },
      }))
    )
      throw new Error(
        "Reassign or finish upcoming reservations before taking this vehicle offline."
      );
    await tx.vehicleUnit.update({ where: { id }, data: { enabled } });
  });
  revalidatePath("/admin/fleet");
  revalidatePath("/");
}

export async function blockVehicle(form: FormData) {
  await requireAdmin();
  const unitId = String(form.get("unitId"));
  const start = new Date(String(form.get("start"))),
    end = new Date(String(form.get("end")));
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
      throw new Error(
        "This maintenance period overlaps a rental or another block."
      );
    await tx.vehicleReservation.create({
      data: { unitId, startDate: start, endDate: end, reason },
    });
  });
  revalidatePath("/admin/fleet");
  revalidatePath("/");
}

export async function releaseBlock(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const block = await prisma.vehicleReservation.findUniqueOrThrow({
    where: { id },
    include: { unit: true },
  });
  if (block.orderId)
    throw new Error("Booking reservations must be changed through the order.");
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, block.unit.carId);
    await tx.vehicleReservation.update({
      where: { id },
      data: { active: false },
    });
  });
  revalidatePath("/admin/fleet");
  revalidatePath("/");
}

export async function assignVehicle(form: FormData) {
  const admin = await requireAdmin();
  const orderId = String(form.get("orderId")),
    unitId = String(form.get("unitId"));
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, order.carId);
    await expireHolds(tx, order.carId);
    const fresh = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (!["PENDING", "CONFIRMED", "ACTIVE"].includes(fresh.status))
      throw new Error("Only upcoming or active rentals can be assigned.");
    const unit = await tx.vehicleUnit.findFirst({
      where: { id: unitId, carId: order.carId, enabled: true },
    });
    if (!unit)
      throw new Error(
        "Choose an enabled vehicle belonging to the same listing."
      );
    if (
      await tx.vehicleReservation.count({
        where: {
          unitId,
          active: true,
          NOT: { orderId },
          startDate: { lt: bufferedEnd(fresh.endDate) },
          endDate: { gt: fresh.startDate },
        },
      })
    )
      throw new Error("This vehicle has an overlapping reservation.");
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
      data: { inventoryConflict: false },
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
}
