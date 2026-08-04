"use client";

import { useTransition } from "react";
import { cancelOrder } from "@/app/actions/order";

export default function OrderCancelButton({
  orderId,
  startDate,
  status,
}: {
  orderId: string;
  startDate: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  const canCancel = (() => {
    if (status === "CANCELLED" || status === "COMPLETED") return false;
    const now = new Date();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const cutoff = new Date(start);
    cutoff.setDate(cutoff.getDate() - 2);
    return now < cutoff;
  })();

  const handleClick = () => {
    if (!canCancel) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;

    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (!result.success) {
        alert(result.message);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending || !canCancel}
      title={
        canCancel
          ? "Cancel order"
          : "Cancellation unavailable (within 2 days of start date)"
      }
      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
        canCancel
          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 hover:shadow-lg hover:shadow-red-500/10 hover:-translate-y-0.5 active:translate-y-0"
          : "text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-white/5 cursor-not-allowed border border-gray-200 dark:border-white/5"
      } disabled:opacity-50`}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Cancelling...
        </span>
      ) : (
        "Cancel Order"
      )}
    </button>
  );
}
