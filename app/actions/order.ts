"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { book, cancelBooking } from "@/lib/booking";
import { getOrCreateUser } from "@/lib/sync-user";

/* ─────────────── Get Single Order ─────────────── */

export async function getOrderById(orderId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Not authenticated");

  const user = await getOrCreateUser();
  if (!user) throw new Error("User not found");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      car: true,
      user: true,
      review: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== user.id && user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  return {
    id: order.id,
    isOwner: order.userId === user.id,
    review: order.review
      ? {
          rating: order.review.rating,
          comment: order.review.comment,
          createdAt: order.review.createdAt.toISOString(),
        }
      : null,
    paymentStatus: order.paymentStatus,
    currency: order.currency,
    expiresAt: order.expiresAt?.toISOString() || null,
    vehicleName: order.vehicleName,
    policy: order.policy,
    events: order.events.map((e) => ({
      id: e.id,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    })),
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

  const user = await getOrCreateUser();
  if (!user) redirect("/sign-in");

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { car: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return orders.map((o) => ({
    id: o.id,
    paymentStatus: o.paymentStatus,
    currency: o.currency,
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

export async function createOrder(input: import("@/lib/booking").BookingInput) {
  const result = await book(input);
  revalidatePath("/profile/orders");
  revalidatePath("/admin/orders");
  return result;
}

export async function cancelOrder(orderId: string) {
  try {
    await cancelBooking(orderId);
    revalidatePath("/profile/orders");
    revalidatePath(`/profile/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return {
      success: true,
      message: "Booking cancelled. Any eligible refund is being processed.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Cancellation failed.",
    };
  }
}
