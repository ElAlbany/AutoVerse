"use client";

import type { ActionResult } from "@/lib/action-result";
import CarMediaEditor from "./CarMediaEditor";
import { VEHICLE_USES } from "@/lib/vehicle-use";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CAR_MAKES,
  CAR_MODELS,
  CAR_CLASSES,
  FUEL_TYPES,
  DRIVE_TYPES,
  TRANSMISSION_TYPES,
  YEARS,
} from "@/lib/car-options";

type CarFormProps = {
  action: (formData: FormData) => Promise<void | ActionResult>;
  initialData?: {
    id?: string;
    branchId?: string;
    quantity?: number;
    usageTags?: string[];
    groundClearanceMm?: number | null;
    lowRange4x4?: boolean;
    suitableTyres?: boolean;
    roughRoadApproved?: boolean;
    seats?: number | null;
    luggage?: number | null;
    location?: string;
    images?: string[];
    imageSource?: string;
    features?: string[];
    make: string;
    model: string;
    year: number;
    pricePerDay: number;
    fuel_type: string;
    transmission: string;
    drive: string;
    city_mpg: number;
    highway_mpg: number;
    combination_mpg: number;
    cylinders: number;
    displacement: number;
    class: string;
    description: string | null;
    available: boolean;
    featured: boolean;
  };
  branches?: { id: string; name: string; city: string }[];
  mode: "create" | "edit";
  initialBranchId?: string;
  availableNow?: number;
};

export default function CarForm({
  action,
  initialData,
  mode,
  branches = [],
  initialBranchId = "",
  availableNow,
}: CarFormProps) {
  const router = useRouter();
  const [make, setMake] = useState(
    CAR_MAKES.find(
      (m) => m.toLowerCase() === initialData?.make.toLowerCase(),
    ) ||
      initialData?.make ||
      "",
  );
  const [models, setModels] = useState<string[]>(CAR_MODELS[make] || []);
  const [selectedModel, setSelectedModel] = useState(initialData?.model || "");
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleMakeChange = (newMake: string) => {
    setMake(newMake);
    setModels(CAR_MODELS[newMake] || []);
    setSelectedModel("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (uploading) return;
    setPending(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);
      if (result && !result.ok) {
        setError(result.error);
        setPending(false);
      }
    } catch (err: any) {
      if (err.message === "NEXT_REDIRECT") return;
      setError(err.message || "Something went wrong");
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm transition-colors duration-500">
          {error}
        </div>
      )}

      {mode === "edit" && initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      <fieldset className="av-panel space-y-4">
        <legend className="px-2">Branch & stock</legend>
        <div className="av-form-row">
          <label className="av-field">
            Collection branch
            <select
              name={mode === "create" ? "branchId" : undefined}
              required
              disabled={mode === "edit"}
              defaultValue={
                initialData?.branchId ||
                initialBranchId ||
                branches[0]?.id ||
                ""
              }
            >
              <option value="" disabled>
                Choose a branch
              </option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} · {branch.city}
                </option>
              ))}
            </select>
            {mode === "edit" && (
              <input
                type="hidden"
                name="branchId"
                value={initialData?.branchId || ""}
              />
            )}
          </label>
          <label className="av-field">
            Fleet quantity
            <input
              name="quantity"
              type="number"
              min="0"
              max="1000"
              step="1"
              required
              defaultValue={initialData?.quantity ?? 1}
            />
          </label>
        </div>
        <p className="av-muted">
          Total in-service instances at this branch, including booked vehicles.
          For example: quantity 3, one reserved, two available. Reducing stock
          retires only unreserved vehicles; bookings and history are preserved.
        </p>
        {availableNow != null && (
          <p className="av-muted">
            Current fleet: {initialData?.quantity ?? 0} · Available now:{" "}
            {availableNow}. Date-specific availability is checked separately.
          </p>
        )}
        {mode === "edit" && (
          <p className="av-muted">
            You are editing this branch’s listing only. To offer the same model
            elsewhere, add a new listing for that branch.
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Make */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Make <span className="text-red-500">*</span>
          </label>
          <select
            name="make"
            required
            value={make}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          >
            <option value="">Select make</option>
            {make && !CAR_MAKES.some((m) => m === make) && (
              <option value={make}>{make}</option>
            )}
            {CAR_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Model <span className="text-red-500">*</span>
          </label>
          <select
            name="model"
            required
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!make}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue disabled:bg-gray-50 dark:disabled:bg-dark-surface disabled:text-gray-400 dark:disabled:text-dark-muted dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          >
            <option value="">
              {make ? "Select model" : "Select make first"}
            </option>
            {selectedModel && !models.includes(selectedModel) && (
              <option value={selectedModel}>{selectedModel}</option>
            )}
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Year <span className="text-red-500">*</span>
          </label>
          <select
            name="year"
            required
            defaultValue={initialData?.year || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Price per day */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Price per Day ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="pricePerDay"
            step="0.01"
            min="1"
            required
            defaultValue={initialData?.pricePerDay || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          />
        </div>

        {/* Class */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Class
          </label>
          <select
            name="class"
            defaultValue={initialData?.class || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          >
            <option value="">Select class</option>
            {CAR_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Fuel Type
          </label>
          <select
            name="fuel_type"
            defaultValue={initialData?.fuel_type || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          >
            <option value="">Select fuel type</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Drive */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Drive
          </label>
          <select
            name="drive"
            defaultValue={initialData?.drive || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          >
            <option value="">Select drive type</option>
            {DRIVE_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transmission */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Transmission
          </label>
          <select
            name="transmission"
            defaultValue={initialData?.transmission || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          >
            <option value="">Select transmission</option>
            {TRANSMISSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* City MPG */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            City MPG
          </label>
          <input
            type="number"
            name="city_mpg"
            min="0"
            defaultValue={initialData?.city_mpg || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          />
        </div>

        {/* Highway MPG */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Highway MPG
          </label>
          <input
            type="number"
            name="highway_mpg"
            min="0"
            defaultValue={initialData?.highway_mpg || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          />
        </div>

        {/* Combined MPG */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Combined MPG
          </label>
          <input
            type="number"
            name="combination_mpg"
            min="0"
            defaultValue={initialData?.combination_mpg || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          />
        </div>

        {/* Cylinders */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Cylinders
          </label>
          <input
            type="number"
            name="cylinders"
            min="0"
            defaultValue={initialData?.cylinders || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          />
        </div>

        {/* Displacement */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Displacement (L)
          </label>
          <input
            type="number"
            name="displacement"
            step="0.1"
            min="0"
            defaultValue={initialData?.displacement || ""}
            className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-dark-text">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={initialData?.description || ""}
          className="w-full rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue resize-none dark:bg-dark-surface dark:text-dark-text transition-colors duration-500"
          placeholder="Brief description of the car..."
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              name="available"
              defaultChecked={initialData?.available ?? true}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue transition-colors duration-500"></div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Available for rent
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initialData?.featured ?? false}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue transition-colors duration-500"></div>
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
            Featured on homepage
          </span>
        </label>
      </div>

      <fieldset className="av-panel space-y-5">
        <legend className="px-2">Rental details & approved photography</legend>
        <div className="av-form-row">
          <label className="av-field">
            Actual seat capacity
            <input
              type="number"
              name="seats"
              required
              min="1"
              max="20"
              defaultValue={initialData?.seats ?? ""}
            />
          </label>
          <label className="av-field">
            Luggage capacity (bags)
            <input
              type="number"
              name="luggage"
              min="0"
              max="20"
              defaultValue={initialData?.luggage ?? ""}
            />
          </label>
        </div>
        <label className="av-field">
          Features (comma separated)
          <input
            name="features"
            maxLength={1500}
            defaultValue={initialData?.features?.join(", ") || ""}
            placeholder="Apple CarPlay, Heated seats, Parking sensors"
          />
        </label>
        <CarMediaEditor
          initialImages={initialData?.images}
          initialSource={initialData?.imageSource}
          onBusy={setUploading}
        />
      </fieldset>

      <fieldset className="av-panel space-y-5">
        <legend className="px-2">
          Driving suitability · verify this exact vehicle
        </legend>
        <p className="av-muted">
          These tags describe recommended journeys, not permission to drive on
          every road. City driving does not mean city-only. Confirm terrain,
          weather, rental permission and equipment before recommending a route.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {VEHICLE_USES.map((tag) => (
            <label key={tag.id} className="flex items-start gap-3">
              <input
                type="checkbox"
                name="usageTags"
                value={tag.id}
                defaultChecked={initialData?.usageTags?.includes(tag.id)}
                className="mt-1"
              />
              <span>
                <strong>{tag.label}</strong>
                <small className="av-muted block">{tag.description}</small>
              </span>
            </label>
          ))}
        </div>
        <label className="av-field">
          Verified ground clearance (mm)
          <input
            name="groundClearanceMm"
            type="number"
            min="50"
            max="600"
            defaultValue={initialData?.groundClearanceMm ?? ""}
          />
        </label>
        <div className="space-y-3">
          {[
            {
              name: "lowRange4x4",
              label: "Verified 4WD with low-range gearing",
            },
            {
              name: "suitableTyres",
              label: "Tyres verified for the intended conditions",
            },
            {
              name: "roughRoadApproved",
              label:
                "Operator approves rough-road use under the rental agreement",
            },
          ].map((item) => (
            <label key={item.name} className="flex gap-3">
              <input
                name={item.name}
                type="checkbox"
                defaultChecked={Boolean(
                  initialData?.[
                    item.name as
                      | "lowRange4x4"
                      | "suitableTyres"
                      | "roughRoadApproved"
                  ],
                )}
              />
              {item.label}
            </label>
          ))}
        </div>
        <p className="av-muted">
          AutoVerse requires all three checks and at least 205 mm verified
          clearance for its rough-road tag. This screening rule is not a safety
          guarantee. AWD and SUV body style alone do not qualify.
        </p>
      </fieldset>
      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 pt-4 border-t border-gray-100 dark:border-dark-border sm:border-t-0 sm:pt-4">
        <button
          type="button"
          onClick={() => router.push("/admin/cars")}
          className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || uploading}
          className="w-full sm:w-auto bg-primary-blue text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:shadow-lg dark:shadow-primary-blue/20"
        >
          {uploading
            ? "Uploading photographs..."
            : pending
              ? "Saving..."
              : mode === "create"
                ? "Add Car"
                : "Update Car"}
        </button>
      </div>
    </form>
  );
}
