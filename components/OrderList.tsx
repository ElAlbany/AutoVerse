"use client";

import { useOptimistic, useTransition } from "react";
import { cancelOrder } from "@/app/actions/order";
import OrderCard from "./OrderCard";

// Define the shape of a serialized order (matches what getUserOrders returns)
interface SerializedOrder {
  id: string;
  userId: string;
  carId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: string[];
    pricePerDay: number;
    createdAt: string;
  };
}

interface OrderListProps {
  orders: SerializedOrder[];
}

export default function OrderList({ orders }: OrderListProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticOrders, addOptimisticOrder] = useOptimistic<
    SerializedOrder[],
    string
  >(orders, (currentOrders: SerializedOrder[], orderId: string) =>
    currentOrders.map((order: SerializedOrder) =>
      order.id === orderId ? { ...order, status: "CANCELLED" } : order,
    ),
  );

  const handleCancel = (orderId: string) => {
    startTransition(async () => {
      addOptimisticOrder(orderId);
      await cancelOrder(orderId);
    });
  };

  if (optimisticOrders.length === 0) {
    return (
      <div className="bg-gray-50 rounded-3xl p-10 text-center border border-gray-100">
        <p className="text-gray-500">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {optimisticOrders.map((order: SerializedOrder) => (
        <OrderCard
          key={order.id}
          order={order}
          onCancel={() => handleCancel(order.id)}
          isCancelling={isPending}
        />
      ))}
    </div>
  );
}
