"use client";

import Link from "next/link";
import Image from "next/image";
import { useOptimistic, useTransition } from "react";
import { deleteCar, toggleCarStatus } from "@/app/actions/admin";

type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  fuel_type: string;
  transmission: string;
  drive: string;
  class: string;
  images: string[];
  available: boolean;
  featured: boolean;
};

export default function CarTable({ cars }: { cars: Car[] }) {
  const [optimisticCars, setOptimisticCars] = useOptimistic(
    cars,
    (state, updatedCar: Car) =>
      state.map((c) => (c.id === updatedCar.id ? updatedCar : c)),
  );
  const [, startTransition] = useTransition();

  const handleToggle = (car: Car, field: "available" | "featured") => {
    const updated = { ...car, [field]: !car[field] };
    startTransition(async () => {
      setOptimisticCars(updated);
      await toggleCarStatus(car.id, field, !car[field]);
    });
  };

  const handleDelete = (carId: string) => {
    if (!confirm("Are you sure you want to delete this car?")) return;
    startTransition(async () => {
      await deleteCar(carId);
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 font-semibold text-gray-700">Car</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Specs</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Price/Day</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Available</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Featured</th>
            <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {optimisticCars.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No cars found. Add your first car to get started.
              </td>
            </tr>
          )}
          {optimisticCars.map((car) => (
            <tr
              key={car.id}
              className="hover:bg-gray-50/50 transition-colors group"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {car.images[0] ? (
                      <Image
                        src={car.images[0]}
                        alt={`${car.make} ${car.model}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {car.year} {car.make} {car.model}
                    </p>
                    <p className="text-xs text-gray-500">{car.class}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-gray-500 text-xs space-y-0.5">
                <p>
                  {car.fuel_type} •{" "}
                  {car.transmission === "a" ? "Auto" : "Manual"}
                </p>
                <p>{car.drive.toUpperCase()}</p>
              </td>
              <td className="px-6 py-4 font-bold text-gray-900">
                ${car.pricePerDay}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleToggle(car, "available")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    car.available ? "bg-primary-blue" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      car.available ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleToggle(car, "featured")}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    car.featured ? "bg-primary-blue" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      car.featured ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/cars/${car.id}/edit`}
                    className="text-sm text-primary-blue hover:underline"
                  >
                    Edit
                  </Link>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => handleDelete(car.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
