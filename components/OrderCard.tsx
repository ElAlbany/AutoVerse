"use client";

import Image from "next/image";
import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface OrderCardProps {
  order: {
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    car: {
      id: string;
      make: string;
      model: string;
      year: number;
      images: string[];
      pricePerDay: number;
    };
  };
  onCancel: () => void;
  isCancelling: boolean;
}

export default function OrderCard({
  order,
  onCancel,
  isCancelling,
}: OrderCardProps) {
  const carImage = order.car?.images?.[0] || "/hero.png";
  const isActive = ["PENDING", "CONFIRMED", "ACTIVE"].includes(order.status);

  const canCancel = (() => {
    if (order.status === "CANCELLED" || order.status === "COMPLETED")
      return false;
    const now = new Date();
    const start = new Date(order.startDate);
    start.setHours(0, 0, 0, 0);
    const cutoff = new Date(start);
    cutoff.setDate(cutoff.getDate() - 2);
    return now < cutoff;
  })();

  return (
    <div className="group relative bg-white dark:bg-dark-card rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-dark-border transition-all duration-500 hover:shadow-lg hover:shadow-primary-blue/5 dark:hover:shadow-primary-blue/10 hover:-translate-y-1 hover:border-primary-blue/20 dark:hover:border-primary-blue/30">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Car Image */}
        <div className="relative w-full sm:w-40 h-32 sm:h-28 bg-gray-50 dark:bg-white/5 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={carImage}
            alt={`${order.car.make} ${order.car.model}`}
            fill
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
                {order.car.year} {order.car.make} {order.car.model}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {new Date(order.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                →{" "}
                {new Date(order.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Price
              </p>
              <p className="text-xl font-extrabold text-primary-blue dark:text-accent-cyan">
                ${order.totalPrice}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/profile/orders/${order.id}`}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-primary-blue to-primary-blue-200 text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary-blue/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
              >
                View Order
              </Link>
              <Link
                href={`/car-details/${order.car.id}`}
                className="px-4 py-2 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 border border-gray-200 dark:border-white/10"
              >
                View Car
              </Link>
              {isActive && (
                <button
                  onClick={onCancel}
                  disabled={!canCancel || isCancelling}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    canCancel
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20"
                      : "text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 cursor-not-allowed border border-gray-200 dark:border-white/5"
                  }`}
                  title={
                    canCancel
                      ? "Cancel order"
                      : "Cancellation unavailable (within 2 days)"
                  }
                >
                  {isCancelling ? "Cancelling..." : "Cancel"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
