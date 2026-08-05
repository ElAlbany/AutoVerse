"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface TimelineOrder {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: string[];
  };
  createdAt: string;
}

interface OrderTimelineProps {
  orders: TimelineOrder[];
}

export default function OrderTimeline({ orders }: OrderTimelineProps) {
  const getEventText = (order: TimelineOrder) => {
    switch (order.status) {
      case "PENDING":
        return `Booked ${order.car.year} ${order.car.make} ${order.car.model}`;
      case "CONFIRMED":
        return `Order confirmed for ${order.car.make} ${order.car.model}`;
      case "ACTIVE":
        return `Rental started — ${order.car.make} ${order.car.model}`;
      case "COMPLETED":
        return `Completed rental of ${order.car.make} ${order.car.model}`;
      case "CANCELLED":
        return `Cancelled ${order.car.make} ${order.car.model}`;
      default:
        return `Updated ${order.car.make} ${order.car.model}`;
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "CONFIRMED":
        return "✅";
      case "ACTIVE":
        return "🚗";
      case "COMPLETED":
        return "🏁";
      case "CANCELLED":
        return "❌";
      default:
        return "•";
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 transition-colors duration-500">
      <div className="space-y-0">
        {orders.map((order, index) => {
          const isLast = index === orders.length - 1;

          return (
            <div key={order.id} className="flex gap-4 group">
              {/* Timeline line and dot */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                  {getIcon(order.status)}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-gray-200 dark:bg-dark-border my-1" />
                )}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <Link
                  href={`/profile/orders/${order.id}`}
                  className="block hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                    {getEventText(order)}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-gray-400 dark:text-dark-muted">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-dark-muted">
                      ${order.totalPrice}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
