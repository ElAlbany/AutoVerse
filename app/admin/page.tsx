import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || "all";

  let dateFilter = {};
  if (period === "month") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    dateFilter = { createdAt: { gte: startOfMonth } };
  } else if (period === "year") {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    dateFilter = { createdAt: { gte: startOfYear } };
  }

  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    completedOrders,
    totalCars,
    totalUsers,
  ] = await Promise.all([
    prisma.order.count({ where: dateFilter }),
    prisma.order.count({ where: { ...dateFilter, status: "PENDING" } }),
    prisma.order.count({ where: { ...dateFilter, status: "CONFIRMED" } }),
    prisma.order.count({ where: { ...dateFilter, status: "COMPLETED" } }),
    prisma.car.count(),
    prisma.user.count(),
  ]);

  const revenue = await prisma.order.aggregate({
    where: { ...dateFilter, status: { not: "CANCELLED" } },
    _sum: { totalPrice: true },
  });

  const periods = [
    { key: "all", label: "All Time" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">
            Platform overview at a glance
          </p>
        </div>
        <div className="flex bg-white dark:bg-dark-card rounded-xl p-1 border border-gray-200 dark:border-dark-border shadow-sm transition-colors duration-500">
          {periods.map((p) => (
            <Link
              key={p.key}
              href={`/admin?period=${p.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p.key
                  ? "bg-primary-blue text-white shadow-sm"
                  : "text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Orders"
          value={totalOrders}
          color="blue"
          icon="📦"
        />
        <StatCard
          label="Pending"
          value={pendingOrders}
          color="amber"
          icon="⏳"
        />
        <StatCard
          label="Confirmed"
          value={confirmedOrders}
          color="indigo"
          icon="✅"
        />
        <StatCard
          label="Completed"
          value={completedOrders}
          color="emerald"
          icon="🏁"
        />
        <StatCard label="Total Cars" value={totalCars} color="cyan" icon="🚗" />
        <StatCard
          label="Revenue"
          value={`$${Number(revenue._sum.totalPrice || 0)}`}
          color="purple"
          icon="💰"
        />
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-500">
        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-blue dark:text-accent-cyan">
              {totalUsers}
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
              Registered Users
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round((completedOrders / (totalOrders || 1)) * 100)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
              Completion Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {Math.round((pendingOrders / (totalOrders || 1)) * 100)}%
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
              Pending Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              $
              {totalOrders
                ? Math.round(Number(revenue._sum.totalPrice || 0) / totalOrders)
                : 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
              Avg Order Value
            </p>
          </div>
        </div>
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
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800",
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    cyan: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800",
  };

  return (
    <div
      className={`rounded-2xl p-6 border ${colors[color]} transition-transform hover:-translate-y-1 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
