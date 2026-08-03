"use client";

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
  action: (formData: FormData) => Promise<void>;
  initialData?: {
    id?: string;
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
  mode: "create" | "edit";
};

export default function CarForm({ action, initialData, mode }: CarFormProps) {
  const router = useRouter();
  const [make, setMake] = useState(initialData?.make || "");
  const [models, setModels] = useState<string[]>(CAR_MODELS[make] || []);
  const [selectedModel, setSelectedModel] = useState(initialData?.model || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleMakeChange = (newMake: string) => {
    setMake(newMake);
    setModels(CAR_MODELS[newMake] || []);
    setSelectedModel("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      await action(formData);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {mode === "edit" && initialData?.id && (
        <input type="hidden" name="id" value={initialData.id} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Make */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Make <span className="text-red-500">*</span>
          </label>
          <select
            name="make"
            required
            value={make}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
          >
            <option value="">Select make</option>
            {CAR_MAKES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Model */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Model <span className="text-red-500">*</span>
          </label>
          <select
            name="model"
            required
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={!make}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {make ? "Select model" : "Select make first"}
            </option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Year <span className="text-red-500">*</span>
          </label>
          <select
            name="year"
            required
            defaultValue={initialData?.year || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
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
          <label className="text-sm font-medium text-gray-700">
            Price per Day ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="pricePerDay"
            step="0.01"
            min="1"
            required
            defaultValue={initialData?.pricePerDay || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
          />
        </div>

        {/* Class */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Class</label>
          <select
            name="class"
            defaultValue={initialData?.class || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
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
          <label className="text-sm font-medium text-gray-700">Fuel Type</label>
          <select
            name="fuel_type"
            defaultValue={initialData?.fuel_type || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
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
          <label className="text-sm font-medium text-gray-700">Drive</label>
          <select
            name="drive"
            defaultValue={initialData?.drive || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
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
          <label className="text-sm font-medium text-gray-700">
            Transmission
          </label>
          <select
            name="transmission"
            defaultValue={initialData?.transmission || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
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
          <label className="text-sm font-medium text-gray-700">City MPG</label>
          <input
            type="number"
            name="city_mpg"
            min="0"
            defaultValue={initialData?.city_mpg || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
          />
        </div>

        {/* Highway MPG */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Highway MPG
          </label>
          <input
            type="number"
            name="highway_mpg"
            min="0"
            defaultValue={initialData?.highway_mpg || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
          />
        </div>

        {/* Combined MPG */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Combined MPG
          </label>
          <input
            type="number"
            name="combination_mpg"
            min="0"
            defaultValue={initialData?.combination_mpg || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
          />
        </div>

        {/* Cylinders */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Cylinders</label>
          <input
            type="number"
            name="cylinders"
            min="0"
            defaultValue={initialData?.cylinders || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
          />
        </div>

        {/* Displacement */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Displacement (L)
          </label>
          <input
            type="number"
            name="displacement"
            step="0.1"
            min="0"
            defaultValue={initialData?.displacement || ""}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={initialData?.description || ""}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue resize-none"
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Featured on homepage
          </span>
        </label>
      </div>

      {mode === "edit" && (
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              name="regenerateImages"
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-blue"></div>
          </div>
          <span className="text-sm font-medium text-gray-700">
            Regenerate images (if make/model/year changed)
          </span>
        </label>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary-blue text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? "Saving..." : mode === "create" ? "Add Car" : "Update Car"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cars")}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
