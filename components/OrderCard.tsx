"use client";

import Image from "next/image";
import Link from "next/link";

interface OrderCar {
  id: string;
  make: string;
  model: string;
  year: number;
  images: string[];
  pricePerDay: number;
}

interface OrderCardProps {
  order: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    car: OrderCar;
  };
  onCancel?: () => void;
  isCancelling?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export default function OrderCard({
  order,
  onCancel,
  isCancelling,
}: OrderCardProps) {
  const isActive = ["PENDING", "CONFIRMED", "ACTIVE"].includes(order.status);
  const carImage = order.car?.images?.[0] || "/hero.png";

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Car Image */}
        <div className="relative w-full md:w-52 h-36 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
          <Image
            src={carImage}
            alt={`${order.car.make} ${order.car.model}`}
            fill
            className="object-contain p-3"
          />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 capitalize">
                {order.car.year} {order.car.make} {order.car.model}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {new Date(order.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                &rarr;{" "}
                {new Date(order.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                statusColors[order.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {order.status}
            </span>
          </div>

          <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
            <div>
              <p className="text-sm text-gray-500">Total Price</p>
              <p className="text-2xl font-bold text-primary-blue">
                ${order.totalPrice}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/profile/orders/${order.id}`}
                className="px-5 py-2.5 rounded-full bg-primary-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                View Order
              </Link>
              <Link
                href={`/car-details/${order.car.id}`}
                className="px-5 py-2.5 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                View Car
              </Link>
              {isActive && onCancel && (
                <button
                  onClick={onCancel}
                  disabled={isCancelling}
                  className="px-5 py-2.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
