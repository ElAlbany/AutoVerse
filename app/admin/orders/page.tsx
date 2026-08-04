import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import StatusUpdater from "@/components/StatusUpdater";
import SearchOrders from "@/components/admin/SearchOrders";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim();

  const where = search
    ? {
        OR: [
          { id: { contains: search, mode: "insensitive" as const } },
          {
            user: {
              OR: [
                {
                  firstName: { contains: search, mode: "insensitive" as const },
                },
                {
                  lastName: { contains: search, mode: "insensitive" as const },
                },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
          {
            car: {
              OR: [
                { make: { contains: search, mode: "insensitive" as const } },
                { model: { contains: search, mode: "insensitive" as const } },
              ],
            },
          },
        ],
      }
    : {};

  const orders = await prisma.order.findMany({
    where,
    include: { car: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  // Explicitly serialize every field — no spreading raw Prisma objects
  const serializedOrders = orders.map((o) => ({
    id: o.id,
    userId: o.userId,
    carId: o.carId,
    startDate: o.startDate.toISOString(),
    endDate: o.endDate.toISOString(),
    totalPrice: Number(o.totalPrice),
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    user: {
      id: o.user.id,
      firstName: o.user.firstName,
      lastName: o.user.lastName,
      email: o.user.email,
      phone: o.user.phone,
    },
    car: {
      id: o.car.id,
      make: o.car.make,
      model: o.car.model,
      year: o.car.year,
      pricePerDay: Number(o.car.pricePerDay),
      images: o.car.images,
      fuel_type: o.car.fuel_type,
      transmission: o.car.transmission,
      drive: o.car.drive,
      class: o.car.class,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            Orders
          </h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">
            Manage and update rental orders
          </p>
        </div>
        <SearchOrders initialSearch={search || ""} />
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-dark-surface border-b border-gray-100 dark:border-dark-border transition-colors duration-500">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text">
                  Order ID
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text">
                  Customer
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text">
                  Car
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text">
                  Dates
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text">
                  Total
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-dark-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border transition-colors duration-500">
              {serializedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500 dark:text-dark-muted"
                  >
                    No orders found matching your search.
                  </td>
                </tr>
              )}
              {serializedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <code className="font-mono text-xs bg-gray-100 dark:bg-dark-surface px-2 py-1 rounded-lg text-gray-700 dark:text-dark-text break-all transition-colors duration-500">
                      {order.id}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-dark-text">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted">
                      {order.user.email}
                    </p>
                  </td>
                  <td className="px-6 py-4 capitalize text-gray-900 dark:text-dark-text">
                    {order.car.year} {order.car.make} {order.car.model}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-dark-muted whitespace-nowrap">
                    {new Date(order.startDate).toLocaleDateString()} →{" "}
                    {new Date(order.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-dark-text">
                    ${order.totalPrice}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusUpdater
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
