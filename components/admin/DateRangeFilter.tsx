"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DateRangeFilter({
  from,
  to,
  isCustom,
}: {
  from?: string;
  to?: string;
  isCustom: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fromDate, setFromDate] = useState(from || "");
  const [toDate, setToDate] = useState(to || "");
  const [minToDate, setMinToDate] = useState("");

  // Sync inputs when URL changes (e.g. after Clear or browser back)
  useEffect(() => {
    setFromDate(from || "");
    setToDate(to || "");
  }, [from, to]);

  // Lock "To" to be >= "From"
  useEffect(() => {
    if (fromDate) {
      setMinToDate(fromDate);
      if (toDate && toDate < fromDate) {
        setToDate("");
      }
    } else {
      setMinToDate("");
    }
  }, [fromDate, toDate]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) return;

    const p = new URLSearchParams(searchParams.toString());
    p.set("period", "custom");
    p.set("from", fromDate);
    p.set("to", toDate);
    p.delete("page"); // Reset to page 1 when filter changes
    router.push(`/admin/analytics?${p.toString()}`);
  };

  const handleClear = () => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("period");
    p.delete("from");
    p.delete("to");
    p.delete("page");
    const qs = p.toString();
    router.push(`/admin/analytics${qs ? `?${qs}` : ""}`);
  };

  const hasFilter = Boolean(fromDate || toDate || isCustom);

  return (
    <form
      onSubmit={handleApply}
      className="flex flex-wrap items-end gap-3 bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-dark-muted">
          From
        </label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 dark:text-dark-muted">
          To
        </label>
        <input
          type="date"
          value={toDate}
          min={minToDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-blue/20"
        />
      </div>
      <button
        type="submit"
        disabled={!fromDate || !toDate}
        className="px-4 py-2 rounded-lg bg-primary-blue text-white text-sm font-medium hover:bg-primary-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Apply Range
      </button>

      <button
        type="button"
        onClick={handleClear}
        disabled={!hasFilter}
        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
          hasFilter
            ? "border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-dark-text"
            : "border-transparent text-gray-300 dark:text-dark-border cursor-default"
        }`}
      >
        Clear
      </button>
    </form>
  );
}
