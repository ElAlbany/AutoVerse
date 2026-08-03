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

  const serializedOrders = orders.map((o) => ({
    ...o,
    totalPrice: Number(o.totalPrice),
    startDate: o.startDate.toISOString(),
    endDate: o.endDate.toISOString(),
    createdAt: o.createdAt.toISOString(),
    car: { ...o.car, pricePerDay: Number(o.car.pricePerDay) },
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 mt-1">Manage and update rental orders</p>
        </div>
        <SearchOrders initialSearch={search || ""} />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Order ID
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Customer
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700">Car</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Dates</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Total</th>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {serializedOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No orders found matching your search.
                  </td>
                </tr>
              )}
              {serializedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-700 break-all">
                      {order.id}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{order.user.email}</p>
                  </td>
                  <td className="px-6 py-4 capitalize">
                    {order.car.year} {order.car.make} {order.car.model}
                  </td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                    {new Date(order.startDate).toLocaleDateString()} →{" "}
                    {new Date(order.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
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
