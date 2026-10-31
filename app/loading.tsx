export default function Loading() {
  return (
    <main
      className="av-shell av-page"
      role="status"
      aria-label="Loading AutoVerse"
      aria-busy="true"
    >
      <span className="sr-only">Preparing your AutoVerse page…</span>
      <div className="av-skeleton w-40 h-3 mb-7" />
      <div className="av-skeleton w-3/4 max-w-xl h-14 mb-5" />
      <div className="av-skeleton w-1/2 max-w-md h-4 mb-10" />
      <div className="av-car-grid" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div className="av-panel space-y-5" key={i}>
            <div className="av-skeleton aspect-[16/10]" />
            <div className="av-skeleton h-5 w-2/3" />
            <div className="av-skeleton h-3 w-full" />
            <div className="av-skeleton h-8 w-24" />
          </div>
        ))}
      </div>
    </main>
  );
}
