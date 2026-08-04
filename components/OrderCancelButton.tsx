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
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        canCancel
          ? "text-red-600 bg-red-50 hover:bg-red-100"
          : "text-gray-400 bg-gray-100 cursor-not-allowed"
      } disabled:opacity-50`}
    >
      {pending ? "Cancelling..." : "Cancel"}
    </button>
  );
}
