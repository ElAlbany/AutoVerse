export default function AnalyticsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="h-9 w-56 bg-gray-200 dark:bg-dark-surface rounded-lg" />
          <div className="h-4 w-72 bg-gray-200 dark:bg-dark-surface rounded mt-2" />
        </div>
        <div className="h-10 w-80 bg-gray-200 dark:bg-dark-surface rounded-xl" />
      </div>

      {/* Date range skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-dark-surface rounded-2xl" />

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-gray-200 dark:bg-dark-surface rounded-2xl"
          />
        ))}
      </div>

      {/* Chart + Top Cars skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-gray-200 dark:bg-dark-surface rounded-3xl" />
        <div className="h-80 bg-gray-200 dark:bg-dark-surface rounded-3xl" />
      </div>

      {/* Conversations skeleton */}
      <div className="h-[600px] bg-gray-200 dark:bg-dark-surface rounded-3xl" />
    </div>
  );
}
