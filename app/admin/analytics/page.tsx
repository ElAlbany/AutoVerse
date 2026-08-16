import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import ConversationLineChart from "@/components/admin/ConversationLineChart";

type SearchParams = {
  period?: string;
  from?: string;
  to?: string;
  page?: string;
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
  if (!user || user.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const pageSize = 8;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  // ── Date filtering logic ─────────────────────────────────────
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  switch (params.period) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = new Date(y.getFullYear(), y.getMonth(), y.getDate());
      endDate = new Date(
        y.getFullYear(),
        y.getMonth(),
        y.getDate(),
        23,
        59,
        59,
      );
      break;
    }
    case "week": {
      const w = new Date(now);
      w.setDate(w.getDate() - 7);
      startDate = w;
      break;
    }
    case "month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      if (params.from) startDate = new Date(params.from);
      if (params.to) {
        endDate = new Date(params.to);
        endDate.setHours(23, 59, 59, 999);
      }
      break;
    default:
      startDate = undefined;
      endDate = undefined;
  }

  const dateFilter =
    startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {};

  // ── Fast aggregate query (no joins) ──────────────────────────
  const allAnalytics = await prisma.chatAnalytic.findMany({
    where: dateFilter,
    select: { createdAt: true, carsShown: true },
  });

  // ── Paginated feed query (only 8 rows with user join) ────────
  const [chatFeed, totalChats] = await Promise.all([
    prisma.chatAnalytic.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
    prisma.chatAnalytic.count({ where: dateFilter }),
  ]);

  const totalPages = Math.ceil(totalChats / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);

  // Redirect if user manually entered a page beyond total
  if (currentPage > totalPages && totalPages > 0) {
    const sp = new URLSearchParams();
    if (params.period) sp.set("period", params.period);
    if (params.from) sp.set("from", params.from);
    if (params.to) sp.set("to", params.to);
    sp.set("page", String(totalPages));
    redirect(`/admin/analytics?${sp.toString()}`);
  }

  // ── Aggregate stats ──────────────────────────────────────────
  const totalRecommendations = allAnalytics.reduce(
    (sum, c) => sum + c.carsShown.length,
    0,
  );
  const avgCarsPerChat =
    totalChats > 0 ? (totalRecommendations / totalChats).toFixed(1) : "0";

  const uniqueUsers = await prisma.chatAnalytic.groupBy({
    by: ["userId"],
    where: { ...dateFilter, userId: { not: null } },
    _count: true,
  });

  // ── Chart data: conversations per day ──────────────────────
  const dayMap = new Map<string, number>();
  allAnalytics.forEach((c) => {
    const day = c.createdAt.toISOString().split("T")[0];
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  });
  const chartDays = Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30);

  // ── Top recommended cars ────────────────────────────────────
  const carFreq = new Map<string, number>();
  allAnalytics.forEach((c) => {
    c.carsShown.forEach((id) => {
      carFreq.set(id, (carFreq.get(id) || 0) + 1);
    });
  });
  const topCarIds = Array.from(carFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  // Fetch cars needed for feed + top cars only
  const feedCarIds = Array.from(new Set(chatFeed.flatMap((c) => c.carsShown)));
  const neededCarIds = Array.from(new Set([...topCarIds, ...feedCarIds]));
  const cars =
    neededCarIds.length > 0
      ? await prisma.car.findMany({
          where: { id: { in: neededCarIds } },
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            pricePerDay: true,
            class: true,
            images: true,
            fuel_type: true,
            transmission: true,
            combination_mpg: true,
          },
        })
      : [];

  const carMap = new Map(cars.map((c) => [c.id, c]));

  const topCars = topCarIds
    .map((id) => ({ car: carMap.get(id), count: carFreq.get(id) || 0 }))
    .filter((x): x is { car: NonNullable<typeof x.car>; count: number } =>
      Boolean(x.car),
    );

  // ── Period pills ─────────────────────────────────────────────
  const periods = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "Last 7 Days" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
    { key: "all", label: "All Time" },
  ];

  const activePeriod = params.period || "all";

  const buildLink = (overrides: Partial<SearchParams>) => {
    const p = new URLSearchParams();
    const period = overrides.period ?? params.period;
    if (period && period !== "all") p.set("period", period);
    const fromVal = overrides.from ?? params.from;
    if (fromVal) p.set("from", fromVal);
    const toVal = overrides.to ?? params.to;
    if (toVal) p.set("to", toVal);
    const pageVal = overrides.page ?? params.page;
    if (pageVal && pageVal !== "1") p.set("page", pageVal);
    const qs = p.toString();
    return `/admin/analytics${qs ? `?${qs}` : ""}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const startItem = (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalChats);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            VERO Analytics
          </h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">
            AI assistant insights & customer conversations
          </p>
        </div>

        <div className="flex bg-white dark:bg-dark-card rounded-xl p-1 border border-gray-200 dark:border-dark-border shadow-sm overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {periods.map((p) => (
            <Link
              key={p.key}
              href={buildLink({ period: p.key, page: "1" })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activePeriod === p.key
                  ? "bg-primary-blue text-white shadow-sm"
                  : "text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <DateRangeFilter
        from={params.from}
        to={params.to}
        isCustom={activePeriod === "custom"}
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations"
          value={totalChats}
          icon="💬"
          gradient="from-blue-500 to-cyan-400"
        />
        <StatCard
          label="Recommendations"
          value={totalRecommendations}
          icon="🚗"
          gradient="from-indigo-500 to-purple-400"
        />
        <StatCard
          label="Unique Users"
          value={uniqueUsers.length}
          icon="👤"
          gradient="from-emerald-500 to-teal-400"
        />
        <StatCard
          label="Avg Cars / Chat"
          value={avgCarsPerChat}
          icon="📊"
          gradient="from-amber-500 to-orange-400"
        />
      </div>

      {/* Activity Line Chart + Top Cars */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-dark-border shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-dark-muted mb-2">
            Conversation Activity
            {chartDays.length > 0 && (
              <span className="font-normal text-gray-400 dark:text-dark-muted/70">
                {" "}
                · {chartDays.length} days
              </span>
            )}
          </h3>
          {chartDays.length > 0 ? (
            <ConversationLineChart data={chartDays} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 dark:text-dark-muted text-sm">
              No data for selected period
            </div>
          )}
        </div>

        {/* Top Cars */}
        <div className="bg-white dark:bg-dark-card rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-dark-border shadow-sm">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-dark-muted mb-4">
            Most Recommended Cars
          </h3>
          {topCars.length > 0 ? (
            <div className="space-y-4">
              {topCars.map(({ car, count }, i) => (
                <div key={car.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">
                    {i + 1}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-dark-surface overflow-hidden flex-shrink-0 border border-gray-100 dark:border-dark-border">
                    {car.images?.[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={car.model}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs">
                        🚗
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                      {car.year} {car.make} {car.model}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      {car.class} · ${Number(car.pricePerDay)}/day
                    </p>
                  </div>
                  <span className="text-xs font-bold text-primary-blue dark:text-accent-cyan">
                    {count}×
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-400 dark:text-dark-muted py-8">
              No recommendations yet
            </div>
          )}
        </div>
      </div>

      {/* Conversations Feed */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-100 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">
              Customer Conversations
            </h3>
            <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
              Every message and the cars VERO recommended
            </p>
          </div>
          {totalChats > 0 && (
            <p className="text-xs text-gray-400 dark:text-dark-muted">
              Showing {startItem}–{endItem} of {totalChats}
            </p>
          )}
        </div>

        <div className="divide-y divide-gray-100 dark:divide-dark-border">
          {chatFeed.length > 0 ? (
            chatFeed.map((chat) => (
              <div
                key={chat.id}
                className="p-5 sm:p-6 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Message Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-blue to-accent-cyan flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {chat.user?.firstName?.[0] ||
                        chat.user?.email?.[0] ||
                        "G"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-dark-text">
                        {chat.user
                          ? `${chat.user.firstName || ""} ${chat.user.lastName || ""}`.trim() ||
                            chat.user.email
                          : "Guest User"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-dark-muted">
                        {chat.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}{" "}
                        ·{" "}
                        {chat.createdAt.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary-blue/10 dark:bg-primary-blue/20 text-primary-blue dark:text-accent-cyan uppercase tracking-wide flex-shrink-0">
                    {chat.carsShown.length} car
                    {chat.carsShown.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* User Message */}
                <div className="mb-4">
                  <div className="inline-block px-4 py-2.5 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-sm text-gray-800 dark:text-dark-text leading-relaxed">
                    <span className="text-gray-400 dark:text-dark-muted text-xs font-medium block mb-0.5">
                      Customer asked:
                    </span>
                    {chat.message}
                  </div>
                </div>

                {/* Recommended Cars Grid */}
                {chat.carsShown.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {chat.carsShown.map((carId) => {
                      const car = carMap.get(carId);
                      if (!car) return null;
                      return (
                        <div
                          key={carId}
                          className="group relative bg-white dark:bg-dark-bg rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden hover:shadow-md hover:border-primary-blue/30 dark:hover:border-primary-blue/30 transition-all"
                        >
                          <div className="aspect-[16/10] bg-gray-50 dark:bg-white/5 relative overflow-hidden">
                            {car.images?.[0] ? (
                              <Image
                                src={car.images[0]}
                                alt={`${car.year} ${car.make} ${car.model}`}
                                fill
                                className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">
                                🚗
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
                                {car.class}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-dark-text truncate">
                              {car.year} {car.make} {car.model}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-dark-muted">
                              <span>${Number(car.pricePerDay)}/day</span>
                              <span>·</span>
                              <span>
                                {car.transmission === "a" ? "Auto" : "Manual"}
                              </span>
                              <span>·</span>
                              <span>{car.combination_mpg} MPG</span>
                            </div>
                            <Link
                              href={`/car-details/${car.id}`}
                              className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gradient-to-r from-primary-blue to-accent-cyan text-white text-xs font-semibold hover:shadow-lg hover:shadow-primary-blue/20 transition-all"
                            >
                              <span>View Details</span>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center text-2xl mx-auto mb-4">
                🤖
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-1">
                No conversations yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-dark-muted">
                VERO hasn&apos;t chatted with any customers in this period.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400 dark:text-dark-muted">
              Page {safePage} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              {/* Prev */}
              <Link
                href={
                  safePage > 1 ? buildLink({ page: String(safePage - 1) }) : "#"
                }
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
                  safePage <= 1
                    ? "text-gray-300 dark:text-dark-border cursor-not-allowed pointer-events-none"
                    : "text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-dark-border"
                }`}
                aria-label="Previous page"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>

              {/* Page Numbers */}
              {getPageNumbers().map((num, idx) =>
                num === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-9 h-9 flex items-center justify-center text-xs text-gray-400 dark:text-dark-muted"
                  >
                    ...
                  </span>
                ) : (
                  <Link
                    key={num}
                    href={buildLink({ page: String(num) })}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                      safePage === num
                        ? "bg-primary-blue text-white shadow-sm"
                        : "text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-dark-border"
                    }`}
                  >
                    {num}
                  </Link>
                ),
              )}

              {/* Next */}
              <Link
                href={
                  safePage < totalPages
                    ? buildLink({ page: String(safePage + 1) })
                    : "#"
                }
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
                  safePage >= totalPages
                    ? "text-gray-300 dark:text-dark-border cursor-not-allowed pointer-events-none"
                    : "text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-dark-border"
                }`}
                aria-label="Next page"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: string;
  gradient: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-dark-card p-5 border border-gray-100 dark:border-dark-border shadow-sm group">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full group-hover:opacity-15 transition-opacity`}
      />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl">{icon}</span>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${gradient}`} />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">
        {value}
      </p>
      <p className="text-xs text-gray-500 dark:text-dark-muted mt-1 font-medium">
        {label}
      </p>
    </div>
  );
}
