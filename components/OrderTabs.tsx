"use client";

import { useState } from "react";
import OrderList from "./OrderList";

type Order = {
  id: string;
  userId: string;
  carId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    images: string[];
    pricePerDay: number;
    createdAt: string;
  };
};

interface OrderTabsProps {
  currentOrders: Order[];
  historyOrders: Order[];
}

const TABS = [
  { key: "current" as const, label: "Current" },
  { key: "history" as const, label: "History" },
];

const STATUS_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { key: "newest", label: "Newest First" },
  { key: "price-high", label: "Price: High to Low" },
  { key: "price-low", label: "Price: Low to High" },
  { key: "pickup", label: "Pick-up Date" },
];

export default function OrderTabs({
  currentOrders,
  historyOrders,
}: OrderTabsProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");

  const allOrders = activeTab === "current" ? currentOrders : historyOrders;

  let filtered =
    statusFilter === "ALL"
      ? allOrders
      : allOrders.filter((o) => o.status === statusFilter);

  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price-high":
        return b.totalPrice - a.totalPrice;
      case "price-low":
        return a.totalPrice - b.totalPrice;
      case "pickup":
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      case "newest":
      default:
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  });

  const relevantFilters =
    activeTab === "current"
      ? STATUS_FILTERS.filter(
          (f) =>
            f.key === "ALL" ||
            ["PENDING", "CONFIRMED", "ACTIVE"].includes(f.key),
        )
      : STATUS_FILTERS.filter(
          (f) => f.key === "ALL" || ["COMPLETED", "CANCELLED"].includes(f.key),
        );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-dark-border pb-1">
        {TABS.map((tab) => {
          const count =
            tab.key === "current" ? currentOrders.length : historyOrders.length;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setStatusFilter("ALL");
              }}
              className={`relative px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all duration-300 ${
                isActive
                  ? "text-primary-blue dark:text-accent-cyan"
                  : "text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
              <span
                className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? "bg-primary-blue text-white"
                    : "bg-gray-100 dark:bg-dark-surface text-gray-500 dark:text-dark-muted"
                }`}
              >
                {count}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-blue dark:bg-accent-cyan rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {relevantFilters.map((filter) => {
            const isActive = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary-blue text-white shadow-md shadow-primary-blue/20"
                    : "bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-muted hover:bg-gray-200 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl pl-4 pr-10 py-2 text-sm text-gray-700 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-blue/20 cursor-pointer transition-colors duration-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option
                key={opt.key}
                value={opt.key}
                className="dark:bg-dark-card dark:text-dark-text"
              >
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-dark-muted">
        Showing{" "}
        <span className="font-semibold text-gray-900 dark:text-dark-text">
          {filtered.length}
        </span>{" "}
        order{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Order List */}
      {filtered.length > 0 ? (
        <OrderList orders={filtered} />
      ) : (
        <div className="bg-white dark:bg-dark-card rounded-3xl p-10 text-center border border-gray-100 dark:border-dark-border transition-colors duration-500">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {activeTab === "current"
              ? "No current orders match your filters."
              : "No history orders match your filters."}
          </p>
          {statusFilter !== "ALL" && (
            <button
              onClick={() => setStatusFilter("ALL")}
              className="text-primary-blue dark:text-accent-cyan text-sm font-semibold hover:underline mt-2"
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
