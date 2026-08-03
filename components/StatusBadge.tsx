const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
        statusColors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
