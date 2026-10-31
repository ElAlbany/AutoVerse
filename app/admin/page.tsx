import { prisma } from "@/lib/prisma";
import Link from "next/link";

type ChatAnalyticItem = {
  carsShown: string[];
  message: string | null;
  createdAt: Date;
  user: { firstName: string | null; lastName: string | null } | null;
};

type TopCar = {
  id: string;
  name: string;
  count: number;
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = params.period || "all";

  let dateFilter: Record<string, unknown> = {};
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
    chatAnalytics,
  ] = await Promise.all([
    prisma.order.count({ where: dateFilter }),
    prisma.order.count({ where: { ...dateFilter, status: "PENDING" } }),
    prisma.order.count({ where: { ...dateFilter, status: "CONFIRMED" } }),
    prisma.order.count({ where: { ...dateFilter, status: "COMPLETED" } }),
    prisma.car.count(),
    prisma.user.count(),
    prisma.chatAnalytic.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      select: {
        carsShown: true,
        message: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    }) as Promise<ChatAnalyticItem[]>,
  ]);

  const revenue = await prisma.order.aggregate({
    where: { ...dateFilter, paymentStatus: "PAID" },
    _sum: { totalPrice: true },
  });

  // ── VERO Analytics: compact stats for dashboard link card ─────
  const totalChats = chatAnalytics.length;
  const totalRecommendations = chatAnalytics.reduce(
    (s, c) => s + c.carsShown.length,
    0
  );
  const uniqueUsers = await prisma.chatAnalytic.groupBy({
    by: ["userId"],
    where: { userId: { not: null } },
    _count: true,
  });

  // ── VERO Analytics: top recommended cars (mini preview) ──────
  const carCountMap = new Map<string, number>();
  chatAnalytics.forEach((ca: ChatAnalyticItem) => {
    ca.carsShown.forEach((carId: string) => {
      carCountMap.set(carId, (carCountMap.get(carId) || 0) + 1);
    });
  });

  const topCarIds = Array.from(carCountMap.entries())
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]: [string, number]) => id);

  const topCarDetails =
    topCarIds.length > 0
      ? await prisma.car.findMany({
          where: { id: { in: topCarIds } },
          select: { id: true, make: true, model: true, year: true },
        })
      : [];

  const topCars: TopCar[] = topCarDetails
    .map((car: { id: string; make: string; model: string; year: number }) => ({
      ...car,
      count: carCountMap.get(car.id) || 0,
      name: `${car.year} ${car.make} ${car.model}`,
    }))
    .sort((a: TopCar, b: TopCar) => b.count - a.count);

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
        <div className="flex bg-white dark:bg-dark-card rounded-xl p-1 border border-gray-200 dark:border-dark-border shadow-sm transition-colors duration-500 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {periods.map((p: { key: string; label: string }) => (
            <Link
              key={p.key}
              href={`/admin?period=${p.key}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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

      {/* Quick Stats */}
      <div className="bg-white dark:bg-dark-card rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-500">
        <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-4">
          Quick Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-primary-blue dark:text-accent-cyan">
              {totalUsers}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-muted mt-1">
              Registered Users
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round((completedOrders / (totalOrders || 1)) * 100)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-muted mt-1">
              Completion Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {Math.round((pendingOrders / (totalOrders || 1)) * 100)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-muted mt-1">
              Pending Rate
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              $
              {totalOrders
                ? Math.round(Number(revenue._sum.totalPrice || 0) / totalOrders)
                : 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-dark-muted mt-1">
              Avg Order Value
            </p>
          </div>
        </div>
      </div>

      {/* ── VERO Analytics Link Card ─────────────────────────────── */}
      <Link
        href="/admin/analytics"
        className="block bg-white dark:bg-dark-card rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-500 hover:border-primary-blue/30 dark:hover:border-primary-blue/30 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-blue to-accent-cyan flex items-center justify-center text-2xl shadow-lg shadow-primary-blue/20">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text group-hover:text-primary-blue dark:group-hover:text-accent-cyan transition-colors">
                VERO Analytics
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-muted mt-0.5">
                Deep insights into AI conversations, recommendations & customer
                behavior
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center group-hover:bg-primary-blue group-hover:text-white transition-all">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <span className="text-gray-400 dark:text-dark-muted text-xs uppercase tracking-wider font-semibold">
              Total Chats
            </span>
            <p className="text-xl font-bold text-gray-900 dark:text-dark-text mt-0.5">
              {totalChats}
            </p>
          </div>
          <div>
            <span className="text-gray-400 dark:text-dark-muted text-xs uppercase tracking-wider font-semibold">
              Recommendations
            </span>
            <p className="text-xl font-bold text-gray-900 dark:text-dark-text mt-0.5">
              {totalRecommendations}
            </p>
          </div>
          <div>
            <span className="text-gray-400 dark:text-dark-muted text-xs uppercase tracking-wider font-semibold">
              Unique Users
            </span>
            <p className="text-xl font-bold text-gray-900 dark:text-dark-text mt-0.5">
              {uniqueUsers.length}
            </p>
          </div>
        </div>
      </Link>
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
      className={`rounded-2xl p-4 sm:p-6 border ${colors[color]} transition-transform hover:-translate-y-1 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-xs sm:text-sm font-medium opacity-80">{label}</p>
        <span className="text-lg sm:text-xl">{icon}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-bold">{value}</p>
    </div>
  );
}
