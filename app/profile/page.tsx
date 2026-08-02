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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here's what's happening with your rentals.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Rentals"
          value={currentOrders.length}
          accent="blue"
        />
        <StatCard label="Total Orders" value={orders.length} accent="slate" />
        <StatCard
          label="Completed"
          value={pastOrders.filter((o) => o.status === "COMPLETED").length}
          accent="emerald"
        />
      </div>

      {/* Current Orders */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Current Orders</h2>
          <Link
            href="/profile/orders"
            className="text-primary-blue text-sm font-semibold hover:underline"
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
              className="text-primary-blue font-semibold hover:underline mt-2 inline-block"
            >
              Browse Catalogue
            </Link>
          </EmptyState>
        )}
      </section>

      {/* Recent History */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent History</h2>
          <Link
            href="/profile/orders"
            className="text-primary-blue text-sm font-semibold hover:underline"
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
}: {
  label: string;
  value: number;
  accent: "blue" | "slate" | "emerald";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className={`rounded-2xl p-6 border ${styles[accent]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
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
    <div className="bg-white rounded-3xl p-10 text-center border border-gray-100">
      <p className="text-gray-500">{message}</p>
      {children}
    </div>
  );
}
