"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/admin";

export default function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  const statuses = ["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"];

  const handleChange = (newStatus: string) => {
    if (newStatus === currentStatus) return;
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
    });
  };

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue disabled:opacity-50"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {isPending && s === currentStatus ? "Updating..." : s}
        </option>
      ))}
    </select>
  );
}
