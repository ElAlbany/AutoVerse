"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "@/app/actions/order";

export default function OrderCancelButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    startTransition(async () => {
      await cancelOrder(orderId);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="px-5 py-2.5 rounded-full bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {isPending ? "Cancelling..." : "Cancel Order"}
    </button>
  );
}
