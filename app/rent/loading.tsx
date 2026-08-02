// app/rent/loading.tsx
export default function RentLoading() {
  return (
    <main className="overflow-hidden bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="h-8 w-64 bg-gray-200 rounded-xl mb-2 animate-pulse" />
        <div className="h-5 w-96 bg-gray-200 rounded-full mb-10 animate-pulse" />

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Car Preview Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="h-6 w-40 bg-gray-200 rounded-full mb-4 animate-pulse" />
              <div className="aspect-video bg-gray-100 rounded-2xl mb-4 animate-pulse" />
              <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="h-5 w-32 bg-gray-200 rounded-full mb-3 animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded-full mb-2 animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-12 w-full bg-gray-100 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
            <div className="mt-8 h-14 w-full bg-blue-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </main>
  );
}
