import { getUserOrders } from "@/app/actions/order";
import OrderList from "@/components/OrderList";
import Link from "next/link";

export default async function ProfilePage() {
  const orders = await getUserOrders();

  const currentOrders = orders.filter((o) =>
    ["PENDING", "CONFIRMED", "ACTIVE"].includes(o.status),
  );
  const pastOrders = orders.filter((o) =>
    ["COMPLETED", "CANCELLED"].includes(o.status),
  );

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Here&apos;s what&apos;s happening with your rentals.
        </p>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <StatCard
          label="Active Rentals"
          value={currentOrders.length}
          accent="blue"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatCard
          label="Total Orders"
          value={orders.length}
          accent="purple"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={pastOrders.filter((o) => o.status === "COMPLETED").length}
          accent="emerald"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Current Orders */}
      <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Current Orders
          </h2>
          <Link
            href="/profile/orders"
            className="text-primary-blue dark:text-accent-cyan text-sm font-semibold hover:underline transition-all"
          >
            View All
          </Link>
        </div>
        {currentOrders.length > 0 ? (
          <OrderList orders={currentOrders} />
        ) : (
          <EmptyState message="No active orders. Ready to rent a car?">
            <Link
              href="/"
              className="text-primary-blue dark:text-accent-cyan font-semibold hover:underline mt-2 inline-block transition-all"
            >
              Browse Catalogue
            </Link>
          </EmptyState>
        )}
      </section>

      {/* Recent History */}
      <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Recent History
          </h2>
          <Link
            href="/profile/orders"
            className="text-primary-blue dark:text-accent-cyan text-sm font-semibold hover:underline transition-all"
          >
            View All
          </Link>
        </div>
        {pastOrders.length > 0 ? (
          <OrderList orders={pastOrders.slice(0, 3)} />
        ) : (
          <EmptyState message="No past orders yet." />
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent: "blue" | "purple" | "emerald";
  icon: React.ReactNode;
}) {
  const styles = {
    blue: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      border: "border-blue-100 dark:border-blue-500/20",
      text: "text-blue-700 dark:text-blue-400",
      icon: "text-blue-500",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-500/10",
      border: "border-purple-100 dark:border-purple-500/20",
      text: "text-purple-700 dark:text-purple-400",
      icon: "text-purple-500",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-100 dark:border-emerald-500/20",
      text: "text-emerald-700 dark:text-emerald-400",
      icon: "text-emerald-500",
    },
  };

  const s = styles[accent];

  return (
    <div
      className={`rounded-2xl p-6 border ${s.bg} ${s.border} transition-all duration-500 hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <span className={s.icon}>{icon}</span>
      </div>
      <p className={`text-4xl font-extrabold ${s.text}`}>{value}</p>
    </div>
  );
}

function EmptyState({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-dark-card rounded-3xl p-10 text-center border border-gray-100 dark:border-dark-border">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
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
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
      {children}
    </div>
  );
}
