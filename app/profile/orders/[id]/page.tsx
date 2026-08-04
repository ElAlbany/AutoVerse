import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/app/actions/order";
import OrderCancelButton from "@/components/OrderCancelButton";
import StatusBadge from "@/components/StatusBadge";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let order;
  try {
    order = await getOrderById(id);
  } catch {
    return notFound();
  }

  const isActive = ["PENDING", "CONFIRMED", "ACTIVE"].includes(order.status);
  const carImage = order.car?.images?.[0] || "/hero.png";

  const timeline = [
    {
      label: "Order Placed",
      date: new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      done: true,
    },
    {
      label: "Confirmed",
      date: order.status !== "PENDING" ? "Approved" : "Awaiting approval",
      done: order.status !== "PENDING",
    },
    {
      label: "Rental Starts",
      date: new Date(order.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      done: new Date() >= new Date(order.startDate),
    },
    {
      label: "Rental Ends",
      date: new Date(order.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      done: new Date() >= new Date(order.endDate),
    },
  ];

  const days = Math.ceil(
    (new Date(order.endDate).getTime() - new Date(order.startDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Order Details
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Order ID:{" "}
            <span className="font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded text-xs">
              {order.id.slice(0, 8)}...
            </span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/profile/orders"
            className="px-5 py-2.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-300 border border-gray-200 dark:border-white/10"
          >
            ← Back to Orders
          </Link>
          {isActive && (
            <OrderCancelButton
              orderId={order.id}
              startDate={order.startDate}
              status={order.status}
            />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left: Car & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Car Card */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border transition-all duration-500 hover:shadow-lg">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative w-full md:w-64 h-44 bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden flex-shrink-0">
                <Image
                  src={carImage}
                  alt={`${order.car.make} ${order.car.model}`}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                  {order.car.year} {order.car.make} {order.car.model}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1 capitalize">
                  {order.car.class} •{" "}
                  {order.car.transmission === "a" ? "Automatic" : "Manual"} •{" "}
                  {order.car.drive.toUpperCase()}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <SpecBadge icon="⛽" label={order.car.fuel_type} />
                  <SpecBadge icon="🛞" label={`${order.car.city_mpg} MPG`} />
                  <SpecBadge icon="⚙️" label={`${order.car.cylinders} Cyl`} />
                  <SpecBadge icon="📐" label={`${order.car.displacement}L`} />
                </div>
                <Link
                  href={`/car-details/${order.car.id}`}
                  className="mt-4 text-primary-blue dark:text-accent-cyan text-sm font-semibold hover:underline w-fit transition-all"
                >
                  View Car Page →
                </Link>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
              Rental Timeline
            </h3>
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-dark-border" />
              <div className="space-y-6">
                {timeline.map((step, i) => (
                  <div key={i} className="relative flex items-start gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all duration-500 ${
                        step.done
                          ? "bg-gradient-to-br from-primary-blue to-accent-cyan border-primary-blue text-white shadow-lg shadow-primary-blue/25"
                          : "bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-300 dark:text-gray-600"
                      }`}
                    >
                      {step.done ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {step.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {step.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Receipt */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border lg:sticky lg:top-28 transition-all duration-500 hover:shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">
              Payment Summary
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Daily Rate</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  ${order.car.pricePerDay}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Rental Days</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {days} days
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Pick-up</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(order.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Return</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(order.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-dark-border pt-4 flex justify-between items-center">
                <span className="text-gray-900 dark:text-gray-100 font-bold text-base">
                  Total Paid
                </span>
                <span className="text-2xl font-bold text-gradient">
                  ${order.totalPrice}
                </span>
              </div>
            </div>

            {order.status === "COMPLETED" && (
              <button className="w-full mt-6 py-3 rounded-full bg-gradient-to-r from-primary-blue to-accent-cyan text-white font-bold hover:shadow-lg hover:shadow-primary-blue/30 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0">
                Write a Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-white/5 rounded-full text-sm text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5">
      <span>{icon}</span>
      <span className="capitalize">{label}</span>
    </div>
  );
}
