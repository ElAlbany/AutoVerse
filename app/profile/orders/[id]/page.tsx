import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/app/actions/order";
import OrderCancelButton from "@/components/OrderCancelButton";
import StatusBadge from "@/components/StatusBadge";
import ReviewForm from "@/components/ReviewForm";
import VehicleImage from "@/components/VehicleImage";
import { carImage } from "@/lib/car-media";
import { money } from "@/lib/rental-policy";
import { getStripe } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let order;
  try {
    order = await getOrderById(id);
  } catch {
    notFound();
  }
  let paymentUrl: string | null = null;
  if (
    order.isOwner &&
    order.status === "PENDING" &&
    order.paymentStatus === "UNPAID" &&
    process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
  ) {
    const stored = await prisma.order.findUnique({
      where: { id },
      select: { stripeSessionId: true },
    });
    if (stored?.stripeSessionId) {
      try {
        const session = await getStripe().checkout.sessions.retrieve(
          stored.stripeSessionId
        );
        if (session.status === "open") paymentUrl = session.url;
      } catch {}
    }
  }
  const policy = order.policy as {
    pickup?: string;
    location?: string;
    cancellationHours?: number;
  } | null;
  const expired =
    order.status === "PENDING" &&
    !!order.expiresAt &&
    new Date(order.expiresAt) < new Date();
  return (
    <div className="space-y-6">
      <Link href="/profile/orders" className="av-text-link">
        ← Your rentals
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="av-eyebrow">Rental {id.slice(0, 8)}</p>
          <h1 className="text-3xl mt-3">Your next drive.</h1>
        </div>
        <StatusBadge status={order.status} />
      </div>
      {query.checkout === "complete" && order.paymentStatus === "UNPAID" && (
        <p className="av-alert" role="status">
          Payment verification is in progress. Your booking is confirmed only
          when the verified payment appears below. Refresh this page shortly.
        </p>
      )}
      {expired && (
        <p className="av-alert">
          The hold on this vehicle has ended. Start a new booking to check
          current availability.
        </p>
      )}
      <section className="av-panel">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="av-detail-photo">
            <VehicleImage
              src={carImage(order.car)}
              alt={order.vehicleName || `${order.car.make} ${order.car.model}`}
            />
          </div>
          <div>
            <h2 className="capitalize">
              {order.vehicleName ||
                `${order.car.year} ${order.car.make} ${order.car.model}`}
            </h2>
            <div className="av-quote">
              <div>
                <span>Pickup</span>
                <strong>
                  {new Date(order.startDate).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </strong>
              </div>
              <div>
                <span>Return</span>
                <strong>
                  {new Date(order.endDate).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </strong>
              </div>
              <div>
                <span>Booking total</span>
                <strong>{money(order.totalPrice, order.currency)}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{order.paymentStatus.replaceAll("_", " ")}</strong>
              </div>
            </div>
            <p className="av-muted mt-5">
              Collection:{" "}
              {policy?.location ||
                policy?.pickup ||
                "The team will confirm your collection point."}
            </p>
            <p className="av-muted mt-3">
              Bring your valid driving licence and identification. Collection
              arrangements and any deposit, mileage, and protection terms must
              be confirmed with the rental team.
            </p>
            {paymentUrl && !expired && (
              <a href={paymentUrl} className="av-button mt-5">
                Resume demo payment
              </a>
            )}
            {order.isOwner &&
              ["PENDING", "CONFIRMED"].includes(order.status) && (
                <div className="mt-5">
                  <OrderCancelButton
                    orderId={order.id}
                    status={order.status}
                    startDate={order.startDate}
                  />
                </div>
              )}
            <Link href="/rental-policy" className="av-text-link mt-5">
              Rental terms & cancellation →
            </Link>
          </div>
        </div>
      </section>
      <section className="av-panel">
        <h2>Rental activity</h2>
        <ol className="mt-5 space-y-4">
          {order.events.length ? (
            order.events.map((e) => (
              <li key={e.id}>
                <p className="text-sm">{e.message}</p>
                <p className="av-muted">
                  {new Date(e.createdAt).toLocaleString("en-GB", {
                    timeZone: "UTC",
                  })}{" "}
                  UTC
                </p>
              </li>
            ))
          ) : (
            <li className="av-muted">
              This rental was created before detailed activity tracking was
              introduced.
            </li>
          )}
        </ol>
      </section>
      {order.isOwner && order.status === "COMPLETED" && (
        <ReviewForm orderId={order.id} initial={order.review} />
      )}
    </div>
  );
}
