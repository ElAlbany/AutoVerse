import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserOrders } from "@/app/actions/order";
import { OrderTimeline } from "@components";
import Link from "next/link";
import Image from "next/image";

export default async function ProfilePage() {
  const { userId: clerkId } = await auth();
  const user = clerkId
    ? await prisma.user.findUnique({ where: { clerkId } })
    : null;

  const orders = await getUserOrders();

  const currentOrders = orders.filter((o) =>
    ["PENDING", "CONFIRMED", "ACTIVE"].includes(o.status),
  );
  const pastOrders = orders.filter((o) =>
    ["COMPLETED", "CANCELLED"].includes(o.status),
  );

  const totalSpent = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const completedCount = pastOrders.filter(
    (o) => o.status === "COMPLETED",
  ).length;

  // Find next rental
  const now = new Date();
  const upcomingOrders = currentOrders.filter(
    (o) => new Date(o.startDate) >= now,
  );
  const nextRental = upcomingOrders.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  )[0];

  const daysUntilPickup = nextRental
    ? Math.ceil(
        (new Date(nextRental.startDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {user?.firstName ? `Hey, ${user.firstName}!` : "Welcome back!"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {nextRental
            ? `Your next rental is in ${daysUntilPickup} day${daysUntilPickup !== 1 ? "s" : ""}.`
            : "Ready for your next adventure?"}
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <StatCard
          label="Active"
          value={currentOrders.length}
          color="blue"
          icon="⚡"
        />
        <StatCard
          label="Total Orders"
          value={orders.length}
          color="purple"
          icon="📋"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          color="emerald"
          icon="✅"
        />
        <StatCard
          label="Total Spent"
          value={`$${totalSpent}`}
          color="cyan"
          icon="💰"
        />
      </div>

      {/* Next Rental Feature Card */}
      {nextRental && (
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-blue/10 via-dark-card/80 to-dark-card border border-primary-blue/20 dark:border-primary-blue/20 p-6 md:p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative flex flex-col md:flex-row gap-6 items-center">
              <div className="relative w-full md:w-48 h-32 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0">
                <Image
                  src={nextRental.car.images?.[0] || "/hero.png"}
                  alt={`${nextRental.car.make} ${nextRental.car.model}`}
                  fill
                  className="object-contain p-2"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-blue/20 text-primary-blue dark:text-accent-cyan text-xs font-bold mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-blue animate-pulse" />
                  UPCOMING RENTAL
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                  {nextRental.car.year} {nextRental.car.make}{" "}
                  {nextRental.car.model}
                </h2>
                <p className="text-gray-400 dark:text-gray-400 mt-1">
                  {new Date(nextRental.startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                  {" → "}
                  {new Date(nextRental.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
                  <Link
                    href={`/profile/orders/${nextRental.id}`}
                    className="px-5 py-2 rounded-full bg-primary-blue text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-primary-blue/20"
                  >
                    View Details
                  </Link>
                  <Link
                    href="/profile/orders"
                    className="px-5 py-2 rounded-full bg-white/10 text-gray-300 dark:text-gray-300 text-sm font-semibold hover:bg-white/20 transition-all  dark:border-white/10"
                  >
                    All Orders
                  </Link>
                </div>
              </div>

              <div className="flex-shrink-0 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary-blue/10 dark:bg-primary-blue/20 flex flex-col items-center justify-center border border-primary-blue/20">
                  <span className="text-2xl font-bold text-primary-blue dark:text-accent-cyan">
                    {daysUntilPickup}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No upcoming rental CTA */}
      {!nextRental && (
        <div
          className="animate-slide-up rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-8 text-center"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-blue/10 flex items-center justify-center">
            <span className="text-2xl">🚗</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            No upcoming rentals
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Your garage is empty. Time to pick your next ride!
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-blue text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-primary-blue/20"
          >
            Browse Cars
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* Recent Activity Timeline */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Recent Activity
          </h2>
          <Link
            href="/profile/orders"
            className="text-primary-blue dark:text-accent-cyan text-sm font-semibold hover:underline"
          >
            View All
          </Link>
        </div>

        {orders.length > 0 ? (
          <OrderTimeline orders={orders.slice(0, 4)} />
        ) : (
          <div className="bg-white dark:bg-dark-card rounded-2xl p-8 text-center border border-gray-100 dark:border-dark-border">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No activity yet. Your rental history will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    cyan: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800",
  };

  return (
    <div
      className={`rounded-2xl p-5 border ${colors[color]} transition-all duration-500 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium opacity-80">{label}</p>
        <span className="text-lg">{icon}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
