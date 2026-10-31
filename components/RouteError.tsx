"use client";
import Link from "next/link";
export default function RouteError({
  reset,
}: {
  reset: () => void;
  error?: Error & { digest?: string };
}) {
  return (
    <section className="av-panel av-route-error" role="alert">
      <p className="av-eyebrow">A small detour</p>
      <h1>We couldn't load this page.</h1>
      <p className="av-muted">
        Your saved information is safe. Try again, or return to the collection.
        If a booking was submitted, check My rentals before submitting again.
      </p>
      <div className="flex flex-wrap gap-3 mt-6">
        <button className="av-button" onClick={reset}>
          Try again
        </button>
        <Link href="/profile/orders" className="av-button av-button-outline">
          My rentals
        </Link>
        <Link href="/" className="av-text-link">
          Back to the collection →
        </Link>
      </div>
    </section>
  );
}
