export default function Loading() {
  return (
    <main className="overflow-hidden">
      <div className="animate-pulse">
        {/* Hero Skeleton */}
        <div className="flex xl:flex-row flex-col gap-5 relative z-0 max-w-[1440px] mx-auto">
          <div className="flex-1 pt-36 padding-x">
            <div className="h-6 w-32 bg-gray-200 rounded-full mb-4" />
            <div className="h-16 w-3/4 bg-gray-200 rounded-2xl mb-4" />
            <div className="h-16 w-2/3 bg-gray-200 rounded-2xl mb-6" />
            <div className="h-4 w-full max-w-lg bg-gray-200 rounded-full mb-10" />
            <div className="h-12 w-36 bg-blue-200 rounded-full" />
          </div>
          <div className="xl:flex-[1.5] flex justify-end items-end w-full xl:h-screen">
            <div className="relative xl:w-full w-[90%] xl:h-full h-[590px] bg-gray-100 rounded-tl-[120px]" />
          </div>
        </div>

        {/* Catalogue Skeleton */}
        <div className="mt-12 padding-x padding-y max-width" id="discover">
          <div className="home__text-container mb-8">
            <div className="h-10 w-64 bg-gray-200 rounded-xl mb-2" />
            <div className="h-5 w-48 bg-gray-200 rounded-full" />
          </div>

          <div className="home__filters mb-12">
            <div className="h-12 w-full max-w-2xl bg-gray-200 rounded-full" />
            <div className="home__filter-container mt-4">
              <div className="h-12 w-32 bg-gray-200 rounded-lg" />
              <div className="h-12 w-32 bg-gray-200 rounded-lg" />
            </div>
          </div>

          <div className="home__cars-wrapper">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="car-card group bg-white rounded-3xl p-6 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded-full" />
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                </div>
                <div className="relative w-full h-40 my-3 bg-gray-100 rounded-2xl" />
                <div className="flex w-full mt-4 justify-between">
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                  <div className="h-6 w-16 bg-gray-200 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
