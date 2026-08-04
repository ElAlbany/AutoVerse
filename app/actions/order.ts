"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/email";

/* ─────────────── Get Single Order ─────────────── */

export async function getOrderById(orderId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not found");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { car: true, user: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== user.id && user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return {
    id: order.id,
    userId: order.userId,
    carId: order.carId,
    startDate: order.startDate.toISOString(),
    endDate: order.endDate.toISOString(),
    totalPrice: Number(order.totalPrice),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    car: {
      id: order.car.id,
      make: order.car.make,
      model: order.car.model,
      year: order.car.year,
      pricePerDay: Number(order.car.pricePerDay),
      images: order.car.images,
      fuel_type: order.car.fuel_type,
      transmission: order.car.transmission,
      drive: order.car.drive,
      class: order.car.class,
      city_mpg: order.car.city_mpg,
      cylinders: order.car.cylinders,
      displacement: order.car.displacement,
    },
    user: {
      id: order.user.id,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      email: order.user.email,
    },
  };
}

/* ─────────────── Get User Orders ─────────────── */

export async function getUserOrders() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) redirect("/sign-in");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { car: true },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    carId: o.carId,
    startDate: o.startDate.toISOString(),
    endDate: o.endDate.toISOString(),
    totalPrice: Number(o.totalPrice),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    car: {
      id: o.car.id,
      make: o.car.make,
      model: o.car.model,
      year: o.car.year,
      pricePerDay: Number(o.car.pricePerDay),
      images: o.car.images,
      fuel_type: o.car.fuel_type,
      transmission: o.car.transmission,
      drive: o.car.drive,
      class: o.car.class,
      createdAt: o.car.createdAt.toISOString(),
    },
  }));
}

/* ─────────────── Create Order (4 positional args) ─────────────── */

export async function createOrder(
  carId: string,
  startDate: Date,
  endDate: Date,
  totalPrice: number,
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) throw new Error("User not found");

  if (
    !carId ||
    isNaN(startDate.getTime()) ||
    isNaN(endDate.getTime()) ||
    isNaN(totalPrice)
  ) {
    throw new Error("Invalid order data");
  }

  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("Car not found");
  if (!car.available) throw new Error("This car is no longer available");

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      carId,
      startDate,
      endDate,
      totalPrice,
      status: "PENDING",
    },
    include: { car: true },
  });

  await sendOrderStatusEmail({
    to: user.email,
    subject: "Order Received - Under Review",
    orderId: order.id,
    carName: `${car.year} ${car.make} ${car.model}`,
    status: "PENDING",
    startDate: order.startDate.toISOString(),
    endDate: order.endDate.toISOString(),
    totalPrice: Number(order.totalPrice),
  });

  revalidatePath("/profile/orders");
}

/* ─────────────── Cancel Order ─────────────── */

export async function cancelOrder(orderId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { success: false, message: "Not authenticated" };

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return { success: false, message: "User not found" };

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { car: true },
  });

  if (!order) return { success: false, message: "Order not found" };
  if (order.status === "CANCELLED")
    return { success: false, message: "Order already cancelled" };
  if (order.status === "COMPLETED")
    return { success: false, message: "Cannot cancel a completed order" };

  const now = new Date();
  const start = new Date(order.startDate);
  start.setHours(0, 0, 0, 0);
  const cutoff = new Date(start);
  cutoff.setDate(cutoff.getDate() - 2);

  if (now >= cutoff) {
    return {
      success: false,
      message:
        "Cancellation is only available up to 2 days before the rental start date.",
    };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  await sendOrderStatusEmail({
    to: user.email,
    subject: "Order Cancelled",
    orderId: order.id,
    carName: `${order.car.year} ${order.car.make} ${order.car.model}`,
    status: "CANCELLED",
    startDate: order.startDate.toISOString(),
    endDate: order.endDate.toISOString(),
    totalPrice: Number(order.totalPrice),
  });

  revalidatePath("/profile/orders");
  revalidatePath("/admin/orders");

  return { success: true, message: "Order cancelled successfully" };
}
