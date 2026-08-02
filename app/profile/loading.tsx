export default function ProfileLoading() {
  return (
    <div className="animate-pulse space-y-10">
      <div className="h-8 w-64 bg-gray-200 rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-40 bg-white rounded-3xl border border-gray-100"
          />
        ))}
      </div>
    </div>
  );
}
