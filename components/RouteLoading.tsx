export default function RouteLoading({
  title = "Loading your page",
}: {
  title?: string;
}) {
  return (
    <div
      className="av-route-loading av-panel"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="av-eyebrow">AutoVerse</p>
      <h2 className="mt-3 mb-6">{title}…</h2>
      <div aria-hidden="true" className="space-y-5">
        <div className="av-skeleton h-9 w-2/3" />
        <div className="av-skeleton h-24 w-full" />
        <div className="av-skeleton h-24 w-full" />
      </div>
      <span className="sr-only">Please wait.</span>
    </div>
  );
}
