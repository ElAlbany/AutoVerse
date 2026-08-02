"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOrder(
  carId: string,
  startDate: Date,
  endDate: Date,
  totalPrice: number,
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) throw new Error("User not found");

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      carId,
      startDate,
      endDate,
      totalPrice,
      status: "PENDING",
    },
  });

  revalidatePath("/profile");
  return order;
}

export async function getUserOrders() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      orders: {
        include: { car: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) throw new Error("User not found");

  // Serialize for client components
  return user.orders.map((o) => ({
    ...o,
    totalPrice: Number(o.totalPrice),
    startDate: o.startDate.toISOString(),
    endDate: o.endDate.toISOString(),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    car: {
      ...o.car,
      pricePerDay: Number(o.car.pricePerDay),
      createdAt: o.car.createdAt.toISOString(),
    },
  }));
}

export async function cancelOrder(orderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
  if (!user) throw new Error("User not found");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
  });
  if (!order) throw new Error("Order not found");

  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    throw new Error("Cannot cancel this order");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/profile");
  revalidatePath("/profile/orders");
}

export async function getOrderById(orderId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
  if (!user) throw new Error("User not found");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
    include: { car: true },
  });

  if (!order) throw new Error("Order not found");

  return {
    ...order,
    totalPrice: Number(order.totalPrice),
    startDate: order.startDate.toISOString(),
    endDate: order.endDate.toISOString(),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    car: {
      ...order.car,
      pricePerDay: Number(order.car.pricePerDay),
      createdAt: order.car.createdAt.toISOString(),
    },
  };
}
