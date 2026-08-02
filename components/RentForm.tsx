"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/order";

export default function RentForm({ car }: { car: any }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pricePerDay = Number(car.pricePerDay);
  const days =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;
  const totalPrice = days * pricePerDay;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      await createOrder(
        car.id,
        new Date(startDate),
        new Date(endDate),
        totalPrice,
      );
      router.push("/profile/orders");
    } catch (err) {
      alert("Booking failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pick-up Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Return Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              min={startDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue transition-all"
              required
            />
          </div>
        </div>
      </div>

      {days > 0 && (
        <div className="bg-gray-50 rounded-2xl p-6 space-y-3 border border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              ${pricePerDay} × {days} days
            </span>
            <span className="font-medium text-gray-900">${totalPrice}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Insurance & Fees</span>
            <span className="font-medium text-emerald-600">Included</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
            <span className="text-gray-900 font-bold">Total</span>
            <span className="text-3xl font-bold text-primary-blue">
              ${totalPrice}
            </span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || days === 0}
        className="w-full py-4 rounded-full bg-primary-blue text-white font-bold text-lg transition-all duration-300 ease-in-out hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          "Confirm Booking"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        By confirming, you agree to our Terms of Service and Rental Policy.
      </p>
    </form>
  );
}
