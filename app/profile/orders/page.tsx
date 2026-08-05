import { getUserOrders } from "@/app/actions/order";
import { OrderTabs } from "@components";

type Order = Awaited<ReturnType<typeof getUserOrders>>[number];

export default async function OrdersPage() {
  const orders = await getUserOrders();

  const currentOrders = orders.filter((o: Order) =>
    ["PENDING", "CONFIRMED", "ACTIVE"].includes(o.status),
  );
  const historyOrders = orders.filter((o: Order) =>
    ["COMPLETED", "CANCELLED"].includes(o.status),
  );

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Orders
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View and manage all your rentals in one place.
        </p>
      </div>

      <OrderTabs currentOrders={currentOrders} historyOrders={historyOrders} />
    </div>
  );
}
