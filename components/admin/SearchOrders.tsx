"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchOrders({
  initialSearch,
}: {
  initialSearch: string;
}) {
  const [query, setQuery] = useState(initialSearch);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/admin/orders?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/admin/orders");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
    >
      <div className="relative flex-1 sm:flex-none">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID, name, or car..."
          className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-sm bg-white dark:bg-dark-card dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all duration-500"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted text-sm transition-colors duration-500">
          🔍
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors dark:shadow-lg dark:shadow-primary-blue/20"
        >
          Search
        </button>
        {initialSearch && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push("/admin/orders");
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-muted text-sm font-medium hover:bg-gray-200 dark:hover:bg-white/5 transition-colors duration-500"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
