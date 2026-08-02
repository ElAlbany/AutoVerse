export default function CarDetailsLoading() {
  return (
    <main className="min-h-screen bg-gray-50 pt-28 pb-16 animate-pulse">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-br from-gray-200 to-gray-300 h-96" />

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 h-64 border border-gray-100" />
            <div className="bg-white rounded-3xl p-6 h-48 border border-gray-100" />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 h-96 border border-gray-100 sticky top-28" />
          </div>
        </div>
      </div>
    </main>
  );
}
