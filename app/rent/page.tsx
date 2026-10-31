import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import RentForm from "@/components/RentForm";
import VehicleImage from "@/components/VehicleImage";
import { carImage } from "@/lib/car-media";
import { money } from "@/lib/rental-policy";
export default async function RentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const car = await prisma.car.findFirst({
    where: { id: params.carId || "", archived: false },
  });
  if (!car) notFound();
  const payments =
    !!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") &&
    !!process.env.STRIPE_WEBHOOK_SECRET;
  return (
    <main className="av-shell av-page">
      <nav className="av-breadcrumb" aria-label="Breadcrumb">
        <Link href="/#discover">Collection</Link>
        <span>/</span>
        <Link href={`/car-details/${car.id}`}>
          {car.make} {car.model}
        </Link>
        <span>/ Your rental</span>
      </nav>
      <div className="av-booking-layout">
        <aside className="av-panel av-booking-summary">
          <div className="av-detail-photo">
            <VehicleImage
              src={carImage(car)}
              alt={`${car.make} ${car.model}`}
            />
          </div>
          <h2>
            {car.year} {car.make} {car.model}
          </h2>
          <p className="av-muted">
            {car.class} · {car.transmission === "a" ? "Automatic" : "Manual"} ·{" "}
            {car.location}
          </p>
          <p className="av-muted mt-4">
            {money(Number(car.pricePerDay))} per rental day
          </p>
          <hr className="my-6 border-[var(--border-color)]" />
          <p className="av-eyebrow">Before collection</p>
          <p className="av-muted mt-3">
            Bring a valid driving licence and identification. The rental team
            will confirm collection instructions, eligibility, mileage, deposit,
            and protection terms before handover.
          </p>
        </aside>
        <section className="av-panel">
          <p className="av-eyebrow">Your next chapter</p>
          <h1 className="text-3xl mt-3 mb-3">Make it yours.</h1>
          <p className="av-muted mb-7">
            Choose a little time for the road. We’ll check the details.
          </p>
          <RentForm
            car={{
              id: car.id,
              available: car.available,
              pricePerDay: Number(car.pricePerDay),
            }}
            paymentEnabled={payments}
            initialStart={params.start}
            initialEnd={params.end}
          />
        </section>
      </div>
    </main>
  );
}
