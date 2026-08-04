"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchCars({
  initialSearch,
}: {
  initialSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    router.push(`/admin/cars?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted transition-colors duration-500">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by make, model, or year..."
          className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue w-64 bg-white dark:bg-dark-card dark:text-dark-text transition-colors duration-500"
        />
      </div>
      <button
        type="submit"
        className="bg-primary-blue text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors dark:shadow-lg dark:shadow-primary-blue/20"
      >
        Search
      </button>
      {initialSearch && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push("/admin/cars");
          }}
          className="px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Clear
        </button>
      )}
    </form>
  );
}
