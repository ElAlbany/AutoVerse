import Link from "next/link";
export default function NotFound() {
  return (
    <main className="av-shell av-page">
      <section className="av-panel av-empty">
        <p className="av-eyebrow justify-center">404 / A different route</p>
        <h1 className="text-4xl mt-5">This page has moved on.</h1>
        <p>
          The vehicle, booking, or page may no longer be available to this
          account.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="av-button">
            Browse the collection
          </Link>
          <Link href="/profile/orders" className="av-button av-button-outline">
            My rentals
          </Link>
        </div>
      </section>
    </main>
  );
}
