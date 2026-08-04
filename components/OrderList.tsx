"use client";

import { useOptimistic, useTransition } from "react";
import { cancelOrder } from "@/app/actions/order";
import OrderCard from "./OrderCard";

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
      <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-10 text-center border border-gray-100 dark:border-dark-border">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">No orders found.</p>
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
