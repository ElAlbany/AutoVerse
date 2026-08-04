"use client";

const statusConfig: Record<
  string,
  { bg: string; text: string; border: string; glow: string; dot: string }
> = {
  PENDING: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/30",
    glow: "shadow-amber-500/20",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-500/30",
    glow: "shadow-blue-500/20",
    dot: "bg-blue-500",
  },
  ACTIVE: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/30",
    glow: "shadow-emerald-500/20",
    dot: "bg-emerald-500",
  },
  COMPLETED: {
    bg: "bg-slate-50 dark:bg-slate-500/10",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-500/30",
    glow: "shadow-slate-500/20",
    dot: "bg-slate-500",
  },
  CANCELLED: {
    bg: "bg-red-50 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-500/30",
    glow: "shadow-red-500/20",
    dot: "bg-red-500",
  },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.COMPLETED;
  const isPending = status === "PENDING";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} transition-all duration-300 ${isPending ? "animate-pulse" : ""}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot} ${isPending ? "animate-ping" : ""}`}
      />
      {status}
    </span>
  );
}
