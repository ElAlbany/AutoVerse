import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SearchUsers from "@/components/admin/SearchUsers";
import UserTable from "@/components/admin/UserTable";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { clerkId },
  });
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const search = params.search?.trim().toLowerCase();

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, totalUsers, adminCount, userCount, totalOrders] =
    await Promise.all([
      prisma.user.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.count(),
    ]);

  // Serialize explicitly — no raw Prisma objects to client
  const serializedUsers = users.map((u) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    _count: { orders: u._count.orders },
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 mt-1">Manage platform users and roles</p>
        </div>
        <SearchUsers initialSearch={search || ""} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={totalUsers}
          color="blue"
          icon="👥"
        />
        <StatCard label="Admins" value={adminCount} color="purple" icon="🛡️" />
        <StatCard
          label="Customers"
          value={userCount}
          color="emerald"
          icon="🧑‍💼"
        />
        <StatCard
          label="Total Orders"
          value={totalOrders}
          color="amber"
          icon="📦"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">All Users</h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            {serializedUsers.length} result
            {serializedUsers.length !== 1 ? "s" : ""}
          </span>
        </div>
        <UserTable users={serializedUsers} currentUserId={currentUser.id} />
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
  value: number;
  color: string;
  icon: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div
      className={`rounded-2xl p-5 border ${colors[color]} transition-transform hover:-translate-y-1 hover:shadow-md`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
