import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import BookingSearch from "./BookingSearch";

export default function Hero({
  start = "",
  end = "",
  location = "",
}: {
  start?: string;
  end?: string;
  location?: string;
}) {
  return (
    <section className="av-hero av-shell">
      <div className="av-hero-copy">
        <p className="av-eyebrow">
          <span /> A considered car rental experience
        </p>
        <h1>
          A better way
          <br />
          to <em>get there.</em>
        </h1>
        <p>
          Room for the everyday. <br />
          Something special for the escape. <br />
          Find the right car for your next chapter.
        </p>
        <Link href="#discover" className="av-text-link">
          Explore the collection <ArrowUpRight size={18} />
        </Link>
        <div className="av-hero-note">
          <span>01 /</span> CHOOSE WELL. DRIVE YOUR WAY.
        </div>
      </div>
      <div className="av-hero-photo">
        <Image
          src="/autoverse-editorial.jpg"
          alt="An automotive editorial photograph in a concrete garage"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 55vw"
          className="object-cover"
        />
        <div className="av-photo-caption">
          <span>THE ART OF GETTING AWAY</span>
          <span>AutoVerse / Journal 01</span>
        </div>
      </div>
      <div className="av-hero-search">
        <BookingSearch start={start} end={end} location={location} />
      </div>
    </section>
  );
}
