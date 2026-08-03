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
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by ID, name, or car..."
          className="w-64 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          🔍
        </span>
      </div>
      <button
        type="submit"
        className="px-5 py-2.5 rounded-xl bg-primary-blue text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
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
          className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Clear
        </button>
      )}
    </form>
  );
}
