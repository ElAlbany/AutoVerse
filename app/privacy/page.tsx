import Link from "next/link";
export const metadata = {
  title: "Your information. Handled thoughtfully. · AutoVerse",
};
export default function Guide() {
  return (
    <main className="av-shell av-page">
      <div className="av-prose">
        <p className="av-eyebrow">AutoVerse / The rental guide</p>
        <h1 className="text-4xl my-5">
          Your information. Handled thoughtfully.
        </h1>
        <p className="av-intro">
          Privacy overview for this AutoVerse demonstration.
        </p>
        <section>
          <h2>Accounts and bookings</h2>
          <p>
            Clerk manages account authentication. AutoVerse stores account
            identifiers, contact details provided through sign-in, rental
            records, saved cars and reviews. Booking and payment records are
            retained to support rental operations. The operating company must
            publish its identity, retention periods and privacy contact before
            launch.
          </p>
        </section>
        <section>
          <h2>Payments and service providers</h2>
          <p>
            Stripe processes sandbox payment details on its own checkout page.
            AutoVerse stores payment references and status, not raw card
            numbers. Configured email delivery uses Resend. The optional VERO
            assistant sends submitted conversation content to Google’s Gemini
            service; avoid entering sensitive personal information.
          </p>
        </section>
        <section>
          <h2>Browser storage</h2>
          <p>
            A theme cookie remembers your appearance preference. A comparison
            shortlist is stored in your browser. The VERO conversation may be
            stored locally on your device. Authentication cookies are managed by
            Clerk.
          </p>
        </section>
        <section>
          <h2>Reviews and data requests</h2>
          <p>
            Reviews are public with the author’s first name and rental
            verification. Do not include personal or sensitive details in
            reviews. Contact the company operating this site for access,
            correction, retention, or deletion requests; its contact details
            must be configured before a public launch.
          </p>
        </section>
        <Link href="/#discover" className="av-button mt-6">
          Explore the collection →
        </Link>
      </div>
    </main>
  );
}
