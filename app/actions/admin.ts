"use server";
import { randomUUID } from "node:crypto";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { lockCar, expireHolds } from "@/lib/inventory";
import { queueOrderEmail } from "@/lib/notifications";
import { refundOrder } from "@/lib/payments";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
export async function updateOrderStatus(orderId: string, status: string) {
  const admin = await requireAdmin();
  if (!Object.values(OrderStatus).includes(status as OrderStatus))
    throw new Error("Invalid status.");
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
      throw new Error("This status change is not allowed.");
    if (["CONFIRMED", "ACTIVE"].includes(status)) {
      if (
        order.inventoryConflict ||
        !order.reservation?.active ||
        !order.reservation.unit.enabled
      )
        throw new Error(
          "Resolve the vehicle assignment in Fleet before confirming this rental.",
        );
      if (
        (order.policy as { payment?: string } | null)?.payment ===
          "stripe-sandbox" &&
        order.paymentStatus !== "PAID"
      )
        throw new Error("Sandbox checkout must be paid before confirmation.");
      if (status === "CONFIRMED" && order.endDate <= new Date())
        throw new Error("An expired rental cannot be confirmed.");
      if (status === "ACTIVE" && order.startDate > new Date())
        throw new Error(
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
    if (status === "COMPLETED" && order.reservation) {
      const returned = new Date();
      const preparationEnd = new Date(returned.getTime() + 60 * 60000);
      if (
        await tx.vehicleReservation.count({
          where: {
            unitId: order.reservation.unitId,
            active: true,
            NOT: { orderId },
            startDate: { lt: preparationEnd },
            endDate: { gt: returned },
          },
        })
      )
        throw new Error(
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
        actorId: admin.id,
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
    await refundOrder(orderId);
  } catch {
    /* Queued refunds are retried by maintenance. */
  }
  revalidatePath("/admin/orders");
  revalidatePath("/admin/fleet");
  revalidatePath("/profile/orders");
  revalidatePath(`/profile/orders/${orderId}`);
}

function carData(form: FormData) {
  const text = (key: string, max = 200) =>
    String(form.get(key) || "")
      .trim()
      .slice(0, max);
  const num = (key: string, fallback = 0) => {
    const raw = text(key);
    return raw ? Number(raw) : fallback;
  };
  const make = text("make"),
    model = text("model"),
    year = num("year"),
    pricePerDay = num("pricePerDay");
  if (
    !make ||
    !model ||
    !Number.isInteger(year) ||
    year < 1990 ||
    year > new Date().getFullYear() + 2 ||
    !Number.isFinite(pricePerDay) ||
    pricePerDay <= 0 ||
    pricePerDay > 100000
  )
    throw new Error(
      "Provide a make, model, valid year and positive daily rate.",
    );
  const seats = text("seats") ? num("seats") : null,
    luggage = text("luggage") ? num("luggage") : null;
  if (seats !== null && (!Number.isInteger(seats) || seats < 1 || seats > 20))
    throw new Error("Seats must be 1–20.");
  if (
    luggage !== null &&
    (!Number.isInteger(luggage) || luggage < 0 || luggage > 20)
  )
    throw new Error("Luggage capacity must be 0–20.");
  const images = text("images", 4000)
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (
    images.length > 12 ||
    images.some((v) => !v.startsWith("/vehicle-") && !/^https:\/\//.test(v))
  )
    throw new Error("Use up to 12 HTTPS image URLs, one per line.");
  const metrics = {
    city_mpg: num("city_mpg"),
    highway_mpg: num("highway_mpg"),
    combination_mpg: num("combination_mpg"),
    cylinders: num("cylinders"),
    displacement: num("displacement"),
  };
  if (
    Object.values(metrics).some((v) => !Number.isFinite(v) || v < 0 || v > 1000)
  )
    throw new Error(
      "Vehicle specifications must be valid non-negative numbers.",
    );
  const transmission = text("transmission");
  if (!["a", "m"].includes(transmission))
    throw new Error("Choose a valid transmission.");
  return {
    make,
    model,
    year,
    pricePerDay,
    seats,
    luggage,
    images,
    features: text("features", 1500)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 30),
    location: text("location") || "Main collection point",
    fuel_type: text("fuel_type"),
    transmission,
    drive: text("drive"),
    class: text("class"),
    description: text("description", 5000) || null,
    available: form.get("available") === "on",
    featured: form.get("featured") === "on",
    ...metrics,
  };
}
export async function createCar(form: FormData) {
  await requireAdmin();
  const data = carData(form);
  await prisma.car.create({
    data: {
      ...data,
      units: { create: { code: `AV-${randomUUID().slice(0, 8)}` } },
    },
  });
  revalidatePath("/");
  revalidatePath("/admin/cars");
  redirect("/admin/cars");
}
export async function updateCar(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const data = carData(form);
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, id);
    if (
      data.available &&
      (await tx.order.count({
        where: {
          carId: id,
          inventoryConflict: true,
          status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        },
      }))
    )
      throw new Error(
        "Resolve legacy assignments in Fleet before enabling this listing.",
      );
    await tx.car.update({ where: { id }, data });
  });
  revalidatePath("/");
  revalidatePath(`/car-details/${id}`);
  revalidatePath("/admin/cars");
  redirect("/admin/cars");
}
export async function deleteCar(id: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, id);
    await tx.car.update({
      where: { id },
      data: { archived: true, available: false },
    });
  });
  revalidatePath("/");
  revalidatePath("/admin/cars");
}
export async function toggleCarStatus(
  id: string,
  field: "available" | "featured",
  value: boolean,
) {
  await requireAdmin();
  if (!["available", "featured"].includes(field) || typeof value !== "boolean")
    throw new Error("Invalid update.");
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, id);
    if (
      field === "available" &&
      value &&
      (await tx.order.count({
        where: {
          carId: id,
          inventoryConflict: true,
          status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
        },
      }))
    )
      throw new Error("Resolve vehicle assignments in Fleet first.");
    await tx.car.update({ where: { id }, data: { [field]: value } });
  });
  revalidatePath("/");
  revalidatePath("/admin/cars");
  revalidatePath(`/car-details/${id}`);
}
export async function updateUserRole(userId: string, role: string) {
  const admin = await requireAdmin();
  if (!["USER", "ADMIN"].includes(role)) throw new Error("Invalid role.");
  if (admin.id === userId && role !== "ADMIN")
    throw new Error("You cannot remove your own admin access.");
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
export async function deleteUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId)
    throw new Error("You cannot delete your own account.");
  if (await prisma.order.count({ where: { userId } }))
    throw new Error(
      "This account has rental history. Use your company's retention and anonymization process instead.",
    );
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}
