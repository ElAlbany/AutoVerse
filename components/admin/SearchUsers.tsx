"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchUsers({
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
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
    >
      <div className="relative flex-1 sm:flex-none">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-muted text-sm transition-colors duration-500">
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue w-full sm:w-72 bg-white dark:bg-dark-card dark:text-dark-text transition-colors duration-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 sm:flex-none bg-primary-blue text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors dark:shadow-lg dark:shadow-primary-blue/20"
        >
          Search
        </button>
        {initialSearch && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              router.push("/admin/users");
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
