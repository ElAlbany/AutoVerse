import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default function Footer() {
  return (
    <footer className="av-footer">
      <div className="av-shell">
        <div className="av-footer-top">
          <div>
            <Link href="/" className="av-footer-brand">
              AutoVerse<span>®</span>
            </Link>
            <p>
              Good cars. Clear choices.
              <br />
              The drive is yours.
            </p>
          </div>
          <div>
            <span className="av-eyebrow">Explore</span>
            <Link href="/#discover">Our collection</Link>
            <Link href="/compare">Compare cars</Link>
            <Link href="/profile/favorites">Saved cars</Link>
          </div>
          <div>
            <span className="av-eyebrow">Your rental</span>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/rental-policy">Rental guide & cancellation</Link>
            <Link href="/profile/orders">
              Manage a booking <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="av-footer-bottom">
          <span>© {new Date().getFullYear()} AutoVerse</span>
          <span>Thoughtfully chosen. Ready for the road.</span>
          <Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
