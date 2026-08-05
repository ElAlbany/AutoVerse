"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchableSelect from "./SearchableSelect";
import { manufacturers, yearsOfProduction, fuels } from "@constants";

const MAKE_OPTIONS = [
  { label: "All Makes", value: "" },
  ...manufacturers.map((m) => ({ label: m, value: m.toLowerCase() })),
];

const YEAR_OPTIONS = [
  { label: "All Years", value: "" },
  ...yearsOfProduction
    .filter((y) => y.value)
    .map((y) => ({ label: y.title, value: y.value })),
];

const FUEL_OPTIONS = [
  { label: "All Fuel Types", value: "" },
  ...fuels
    .filter((f) => f.value)
    .map((f) => ({ label: f.title, value: f.value.toLowerCase() })),
];

const TRANSMISSION_OPTIONS = [
  { label: "All Transmissions", value: "" },
  { label: "Automatic", value: "a" },
  { label: "Manual", value: "m" },
];

const DRIVE_OPTIONS = [
  { label: "All Drives", value: "" },
  { label: "Front Wheel Drive", value: "fwd" },
  { label: "Rear Wheel Drive", value: "rwd" },
  { label: "All Wheel Drive", value: "awd" },
];

const CLASS_OPTIONS = [
  { label: "All Classes", value: "" },
  { label: "SUV", value: "suv" },
  { label: "Sedan", value: "sedan" },
  { label: "Coupe", value: "coupe" },
  { label: "Hatchback", value: "hatchback" },
  { label: "Truck", value: "truck" },
  { label: "Convertible", value: "convertible" },
  { label: "Wagon", value: "wagon" },
  { label: "Minivan", value: "minivan" },
  { label: "Van", value: "van" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
];

const FILTER_KEYS = [
  "manufacturer",
  "model",
  "year",
  "fuel",
  "transmission",
  "drive",
  "class",
  "search",
  "minPrice",
  "maxPrice",
  "sort",
];

interface CarFiltersProps {
  totalResults: number;
}

export default function CarFilters({ totalResults }: CarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    manufacturer: searchParams.get("manufacturer") || "",
    model: searchParams.get("model") || "",
    year: searchParams.get("year") || "",
    fuel: searchParams.get("fuel") || "",
    transmission: searchParams.get("transmission") || "",
    drive: searchParams.get("drive") || "",
    class: searchParams.get("class") || "",
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(window.location.search);

    // Remove old filter params
    FILTER_KEYS.forEach((key) => params.delete(key));

    // Add new ones
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  };

  const clearAll = () => {
    setFilters({
      manufacturer: "",
      model: "",
      year: "",
      fuel: "",
      transmission: "",
      drive: "",
      class: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      sort: "",
    });

    const params = new URLSearchParams(window.location.search);
    FILTER_KEYS.forEach((key) => params.delete(key));

    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...filters, [key]: "" };
    setFilters(newFilters);

    const params = new URLSearchParams(window.location.search);
    params.delete(key);

    const query = params.toString();
    router.push(`${window.location.pathname}${query ? `?${query}` : ""}`, {
      scroll: false,
    });
  };

  const activeFilters = Object.entries(filters).filter(([_, v]) => v !== "");

  const filterLabels: Record<string, string> = {
    manufacturer: "Make",
    model: "Model",
    year: "Year",
    fuel: "Fuel",
    transmission: "Transmission",
    drive: "Drive",
    class: "Class",
    search: "Search",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    sort: "Sort",
  };

  const filterDisplayValues: Record<string, Record<string, string>> = {
    transmission: { a: "Automatic", m: "Manual" },
    drive: { fwd: "FWD", rwd: "RWD", awd: "AWD" },
    sort: {
      "price-low": "Price: Low to High",
      "price-high": "Price: High to Low",
    },
  };

  const getDisplayValue = (key: string, value: string) => {
    if (filterDisplayValues[key]?.[value])
      return filterDisplayValues[key][value];
    if (key === "manufacturer" || key === "fuel" || key === "class")
      return value.charAt(0).toUpperCase() + value.slice(1);
    return value;
  };

  return (
    <div className="space-y-4">
      {/* Top bar: Search + Sort + Filter Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="Search by make, model, or description..."
              className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card pl-10 pr-10 py-2.5 text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors duration-500"
            />
            {filters.search && (
              <button
                onClick={() => {
                  updateFilter("search", "");
                  const params = new URLSearchParams(window.location.search);
                  params.delete("search");
                  router.push(
                    `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`,
                    { scroll: false },
                  );
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-sm font-medium text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-300 shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            {isExpanded ? "Hide Filters" : "Filters"}
            {activeFilters.filter(([k]) => !["search", "sort"].includes(k))
              .length > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary-blue text-white text-xs flex items-center justify-center">
                {
                  activeFilters.filter(([k]) => !["search", "sort"].includes(k))
                    .length
                }
              </span>
            )}
          </button>
        </div>

        {/* Sort + Results Count */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500 dark:text-dark-muted whitespace-nowrap">
            {totalResults} car{totalResults !== 1 ? "s" : ""} found
          </span>

          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => {
                updateFilter("sort", e.target.value);
                // Auto-apply sort immediately
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) {
                  params.set("sort", e.target.value);
                } else {
                  params.delete("sort");
                }
                router.push(
                  `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`,
                  { scroll: false },
                );
              }}
              className="appearance-none bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-700 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary-blue/20 cursor-pointer transition-colors duration-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
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
      </div>

      {/* Active Filter Pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-slide-up">
          {activeFilters.map(([key, value]) => (
            <button
              key={key}
              onClick={() => removeFilter(key)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-blue/10 dark:bg-primary-blue/20 text-primary-blue dark:text-accent-cyan border border-primary-blue/20 dark:border-primary-blue/30 hover:bg-primary-blue/20 dark:hover:bg-primary-blue/30 transition-colors"
            >
              {filterLabels[key]}: {getDisplayValue(key, value)}
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ))}

          <button
            onClick={clearAll}
            className="text-xs text-gray-500 dark:text-dark-muted hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {isExpanded && (
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-5 md:p-6 shadow-sm transition-colors duration-500 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <SearchableSelect
              label="Make"
              value={filters.manufacturer}
              onChange={(v) => updateFilter("manufacturer", v)}
              options={MAKE_OPTIONS}
              placeholder="All Makes"
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                Model
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.model}
                  onChange={(e) => updateFilter("model", e.target.value)}
                  placeholder="e.g. Tiguan, Camry..."
                  className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-4 py-2.5 text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors duration-500"
                />
                {filters.model && (
                  <button
                    onClick={() => updateFilter("model", "")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <SearchableSelect
              label="Year"
              value={filters.year}
              onChange={(v) => updateFilter("year", v)}
              options={YEAR_OPTIONS}
              placeholder="All Years"
            />

            <SearchableSelect
              label="Fuel Type"
              value={filters.fuel}
              onChange={(v) => updateFilter("fuel", v)}
              options={FUEL_OPTIONS}
              placeholder="All Fuel Types"
            />

            <SearchableSelect
              label="Transmission"
              value={filters.transmission}
              onChange={(v) => updateFilter("transmission", v)}
              options={TRANSMISSION_OPTIONS}
              placeholder="All Transmissions"
            />

            <SearchableSelect
              label="Drive"
              value={filters.drive}
              onChange={(v) => updateFilter("drive", v)}
              options={DRIVE_OPTIONS}
              placeholder="All Drives"
            />

            <SearchableSelect
              label="Class"
              value={filters.class}
              onChange={(v) => updateFilter("class", v)}
              options={CLASS_OPTIONS}
              placeholder="All Classes"
            />

            {/* Price Range */}
            <div className="w-full sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1.5">
                Price Range ($/day)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                    placeholder="Min"
                    className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card pl-7 pr-3 py-2.5 text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors duration-500"
                  />
                </div>
                <span className="text-gray-400 text-sm">—</span>
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    placeholder="Max"
                    className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card pl-7 pr-3 py-2.5 text-sm text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-colors duration-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100 dark:border-dark-border">
            <button
              onClick={applyFilters}
              className="px-6 py-2.5 rounded-xl bg-primary-blue text-white text-sm font-semibold hover:bg-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-primary-blue/20 dark:hover:shadow-primary-blue/30"
            >
              Apply Filters
            </button>
            <button
              onClick={clearAll}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
