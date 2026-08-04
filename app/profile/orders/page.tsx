import { getUserOrders } from "@/app/actions/order";
import OrderList from "@/components/OrderList";

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
    <div className="space-y-10">
      <div className="animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Orders
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          View and manage all your rentals in one place.
        </p>
      </div>

      {/* Current Orders */}
      <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          Current Orders
        </h2>
        <OrderList orders={currentOrders} />
      </section>

      {/* History */}
      <section
        className="pt-6 border-t border-gray-200 dark:border-dark-border animate-slide-up"
        style={{ animationDelay: "0.2s" }}
      >
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          Order History
        </h2>
        <OrderList orders={historyOrders} />
      </section>
    </div>
  );
}
