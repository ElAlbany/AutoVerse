"use client";

const STEPS = [
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Completed" },
];

interface OrderProgressProps {
  status: string;
}

export default function OrderProgress({ status }: OrderProgressProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  if (status === "CANCELLED") {
    return (
      <div className="w-full bg-red-50 dark:bg-red-900/10 rounded-full py-2 px-4 border border-red-200 dark:border-red-800">
        <p className="text-xs font-bold text-red-600 dark:text-red-400 text-center">
          ❌ Order Cancelled
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((step, index) => {
          const isActive = index <= currentIndex && currentIndex >= 0;
          const isCurrent = step.key === status;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  isActive
                    ? "bg-primary-blue dark:bg-accent-cyan scale-110"
                    : "bg-gray-200 dark:bg-dark-border"
                } ${
                  isCurrent
                    ? "ring-4 ring-primary-blue/20 dark:ring-accent-cyan/20"
                    : ""
                }`}
              />
              <span
                className={`text-[10px] mt-1.5 font-medium hidden sm:block ${
                  isActive
                    ? "text-primary-blue dark:text-accent-cyan"
                    : "text-gray-400 dark:text-dark-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-blue to-accent-cyan rounded-full transition-all duration-700 ease-out"
          style={{
            width:
              currentIndex >= 0
                ? `${((currentIndex + 1) / STEPS.length) * 100}%`
                : "0%",
          }}
        />
      </div>
    </div>
  );
}
