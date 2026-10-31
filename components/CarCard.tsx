import Link from "next/link";
import { ArrowUpRight, Users, Briefcase, Gauge, Star } from "lucide-react";
import { CarProps } from "@types";
import { carImage, hasCarPhoto } from "@/lib/car-media";
import { money } from "@/lib/rental-policy";
import VehicleImage from "./VehicleImage";
import FavoriteButton from "./FavoriteButton";
import CompareButton from "./CompareButton";

export type ListingCard = CarProps & {
  pricePerDay?: number;
  images?: string[];
  seats?: number | null;
  luggage?: number | null;
  location?: string;
  rating?: number | null;
  reviewCount?: number;
  availableCount?: number;
  tripTotal?: number;
  saved?: boolean;
  bookingQuery?: string;
};
export default function CarCard({ car }: { car: ListingCard }) {
  const href = `/car-details/${car.id}${car.bookingQuery || ""}`;
  return (
    <article className="av-car-card">
      <div className="av-car-media">
        <Link href={href} aria-label={`View ${car.make} ${car.model}`}>
          <VehicleImage
            src={carImage(car)}
            alt={
              hasCarPhoto(car)
                ? `${car.make} ${car.model}`
                : `Illustration; photographs for ${car.make} ${car.model} are being prepared`
            }
          />
        </Link>
        <span className="av-car-category">{car.class}</span>
        {car.id && <FavoriteButton carId={car.id} initial={car.saved} />}
        <span className="av-photo-label">
          {hasCarPhoto(car)
            ? "Vehicle photography"
            : "Illustration · photos coming soon"}
        </span>
      </div>
      <div className="av-car-body">
        <div className="av-car-heading">
          <div>
            <p className="av-car-year">
              {car.year} / {car.location || "Main collection point"}
            </p>
            <h3>
              <Link href={href}>
                {car.make} {car.model}
              </Link>
            </h3>
          </div>
          <span className="av-rating">
            <Star size={13} />
            {car.rating ? car.rating.toFixed(1) : "New"}
            {!!car.reviewCount && <small>({car.reviewCount})</small>}
          </span>
        </div>
        <div className="av-car-specs">
          <span>
            <Users size={15} />
            {car.seats ? `${car.seats} seats` : "Seats on request"}
          </span>
          <span>
            <Briefcase size={15} />
            {car.luggage != null ? `${car.luggage} bags` : "Bags on request"}
          </span>
          <span>
            <Gauge size={15} />
            {car.transmission === "a" ? "Automatic" : "Manual"}
          </span>
        </div>
        <div className="av-car-availability">
          <span
            className={
              car.available && car.availableCount !== 0
                ? "av-dot"
                : "av-dot av-dot-muted"
            }
          />
          {!car.available
            ? "Not accepting bookings"
            : car.availableCount == null
              ? "Choose dates to check availability"
              : `${car.availableCount} available for your dates`}
        </div>
        <div className="av-car-bottom">
          <div>
            <strong>{money(car.tripTotal ?? car.pricePerDay ?? 0)}</strong>
            <span>{car.tripTotal != null ? " / trip" : " / day"}</span>
            <small>
              {car.tripTotal != null
                ? `${money(car.pricePerDay || 0)} per day`
                : "Starting daily rate"}
            </small>
          </div>
          <Link
            className="av-card-cta"
            href={href}
            aria-label={`View ${car.make} ${car.model}`}
          >
            <ArrowUpRight size={21} />
          </Link>
        </div>
        {car.id && (
          <CompareButton
            car={{
              id: car.id,
              make: car.make,
              model: car.model,
              image: carImage(car),
              price: car.pricePerDay || 0,
              seats: car.seats,
              luggage: car.luggage,
              transmission: car.transmission,
              fuel: car.fuel_type,
            }}
          />
        )}
      </div>
    </article>
  );
}
