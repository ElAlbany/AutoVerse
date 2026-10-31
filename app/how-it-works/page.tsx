import Link from "next/link";
export const metadata = {
  title: "A little planning. A better drive. · AutoVerse",
};
export default function Guide() {
  return (
    <main className="av-shell av-page">
      <div className="av-prose">
        <p className="av-eyebrow">AutoVerse / The rental guide</p>
        <h1 className="text-4xl my-5">A little planning. A better drive.</h1>
        <p className="av-intro">
          From choosing your dates to returning the keys, here is what to
          expect.
        </p>
        <section>
          <h2>01 / Find the right car</h2>
          <p>
            Explore the collection without an account. Select pickup and return
            times in your local time zone. Availability is checked against
            physical vehicles and maintenance periods, with a 60-minute
            preparation buffer.
          </p>
        </section>
        <section>
          <h2>02 / Book with clarity</h2>
          <p>
            Sign in only when you are ready to book. Your selected vehicle and
            dates stay in the return link. Review the quote and cancellation
            terms. With demo payments configured, a valid Stripe sandbox payment
            confirms your rental. Otherwise, the team reviews your booking
            request within 24 hours.
          </p>
        </section>
        <section>
          <h2>03 / Collect and enjoy</h2>
          <p>
            Wait for confirmation before making travel arrangements around your
            rental. Bring valid identification and a driving licence. Staff
            record collection and return, and confirm mileage, deposit,
            protection and pickup details.
          </p>
        </section>
        <section>
          <h2>04 / Share your experience</h2>
          <p>
            After staff record your return, leave a verified review from the
            rental page. One review is allowed per completed booking, with a
            14-day editing window.
          </p>
        </section>
        <Link href="/#discover" className="av-button mt-6">
          Explore the collection →
        </Link>
      </div>
    </main>
  );
}
