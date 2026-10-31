import Link from "next/link";
export const metadata = { title: "Know the road ahead. · AutoVerse" };
export default function Guide() {
  return (
    <main className="av-shell av-page">
      <div className="av-prose">
        <p className="av-eyebrow">AutoVerse / The rental guide</p>
        <h1 className="text-4xl my-5">Know the road ahead.</h1>
        <p className="av-intro">
          Rental guide and demonstration terms. Version: 31 October 2026.
        </p>
        <section>
          <h2>Booking and payment</h2>
          <p>
            Browsing and availability checks are public. Booking, saving cars,
            and posting reviews require an account. Online payments in this
            edition use Stripe sandbox credentials only and do not move real
            money. A booking request is not a confirmed reservation until staff
            approve it. Unconfirmed requests expire after 24 hours.
          </p>
        </section>
        <section>
          <h2>Pricing and rental periods</h2>
          <p>
            The server calculates the quote from the listing’s daily rate. Each
            started 24-hour period is charged as a rental day. Rentals must
            start in the future and end after pickup, with a maximum online
            duration of 90 days. Quotes and terms are stored with the booking. A
            separate 60-minute preparation buffer affects availability but does
            not increase rental duration.
          </p>
        </section>
        <section>
          <h2>Cancellation and refunds</h2>
          <p>
            Unconfirmed requests and unpaid checkout holds can be withdrawn at
            any time. Confirmed bookings may be cancelled more than 48 hours
            before the exact pickup time. At or within 48 hours, customer
            cancellation is unavailable. Eligible Stripe sandbox payments
            receive a simulated refund; the rental page shows its status. A
            payment arriving after its inventory hold expires is queued for
            refund rather than confirming an unavailable car.
          </p>
        </section>
        <section>
          <h2>Collection requirements</h2>
          <p>
            A valid driving licence and identification are required. Before
            collection, the rental team must confirm driver eligibility, the
            collection address, any deposit, mileage allowance, fuel policy,
            protection coverage and roadside support. No insurance or 24/7
            assistance promise is implied by this demonstration. A company must
            replace these operational terms with its actual service policies
            before launch.
          </p>
        </section>
        <section>
          <h2>Changes, returns and delays</h2>
          <p>
            Contact the rental team to change dates or request an extension.
            Changes depend on availability and a new quote. Do not assume an
            extension is approved. Actual collection and return are recorded by
            staff. Report delays promptly so the team can protect the next
            customer’s booking.
          </p>
        </section>
        <Link href="/#discover" className="av-button mt-6">
          Explore the collection →
        </Link>
      </div>
    </main>
  );
}
