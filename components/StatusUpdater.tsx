"use client";

import { useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/admin";

const ALL_STATUSES = [
  { value: "PENDING", label: "PENDING" },
  { value: "CONFIRMED", label: "CONFIRMED" },
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "CANCELLED", label: "CANCELLED" },
];

const VALID_NEXT: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["CANCELLED"],
  CANCELLED: [],
};

export default function StatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === currentStatus) return;

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const allowed = VALID_NEXT[currentStatus] || [];
  const options = ALL_STATUSES.filter(
    (s) => s.value === currentStatus || allowed.includes(s.value),
  );

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={pending || options.length <= 1}
      className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-blue/20 disabled:opacity-50 cursor-pointer transition-colors duration-500"
    >
      {options.map((s) => (
        <option
          key={s.value}
          value={s.value}
          className="dark:bg-dark-card dark:text-dark-text"
        >
          {s.label}
        </option>
      ))}
    </select>
  );
}
