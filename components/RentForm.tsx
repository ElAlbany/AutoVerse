"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/order";
import { signInUrl } from "@/lib/sign-in";
import { money, canCancel } from "@/lib/rental-policy";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

type Quote = { days: number; total: number };
export default function RentForm({
  car,
  paymentEnabled = false,
  initialStart = "",
  initialEnd = "",
}: {
  car: { id: string; pricePerDay: number; available: boolean };
  paymentEnabled?: boolean;
  initialStart?: string;
  initialEnd?: string;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [requestKey, setRequestKey] = useState("");
  useEffect(() => {
    const local = (v: string) => {
      const d = new Date(v);
      return Number.isFinite(d.getTime())
        ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : "";
    };
    setStart(local(initialStart));
    setEnd(local(initialEnd));
  }, [initialStart, initialEnd]);
  useEffect(() => {
    setRequestKey(crypto.randomUUID());
    setAccepted(false);
  }, [start, end]);
  useEffect(() => {
    setQuote(null);
    setCount(null);
    setError("");
    if (!start || !end) return;
    const controller = new AbortController();
    const a = new Date(start),
      b = new Date(end);
    if (b <= a || a <= new Date()) {
      setError("Choose a future pickup time and a later return time.");
      return;
    }
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const result = await fetch(
          `/api/availability?${new URLSearchParams({ carId: car.id, start: a.toISOString(), end: b.toISOString() })}`,
          { signal: controller.signal }
        );
        const data = await result.json();
        if (!result.ok) throw new Error(data.error);
        setQuote(data.quote);
        setCount(data.available);
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error
              ? e.message
              : "Availability could not be checked."
          );
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [start, end, car.id]);
  const late = start && !canCancel(new Date(start));
  return (
    <form
      className="av-booking-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!start || !end) return;
        const params = new URLSearchParams({
          carId: car.id,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
        });
        if (!isSignedIn) {
          router.push(signInUrl(`/rent?${params}`));
          return;
        }
        setLoading(true);
        setError("");
        try {
          const result = await createOrder({
            carId: car.id,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            requestKey,
            payment: paymentEnabled,
          });
          window.location.assign(result.url);
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Booking could not be completed. Please try again."
          );
          setLoading(false);
        }
      }}
    >
      <div className="av-form-row">
        <label className="av-field">
          Pickup · your local time
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            required
          />
        </label>
        <label className="av-field">
          Return · your local time
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            required
          />
        </label>
      </div>
      <div aria-live="polite">
        {checking ? (
          <p className="av-muted">Checking the fleet for your dates…</p>
        ) : (
          count != null && (
            <p className="av-muted">
              {count
                ? `${count} vehicle${count === 1 ? "" : "s"} available for this entire period.`
                : "No vehicles available for these dates. Please try another period."}
            </p>
          )
        )}
      </div>
      {quote && (
        <div className="av-quote">
          <div>
            <span>
              {money(car.pricePerDay)} × {quote.days} rental days
            </span>
            <span>{money(quote.total)}</span>
          </div>
          <p className="av-muted">
            Each started 24-hour period is one rental day. Vehicle preparation
            time is reserved separately.
          </p>
          <div className="av-quote-total">
            <span>Booking total</span>
            <strong>{money(quote.total)}</strong>
          </div>
        </div>
      )}
      <div className="av-muted">
        <ShieldCheck size={17} className="inline mr-2" />
        {paymentEnabled
          ? "Stripe sandbox · no real money is charged."
          : "Booking request · no online payment is collected."}
      </div>
      <p className="av-muted">
        {paymentEnabled
          ? "Payment confirms your rental if the vehicle hold is still valid."
          : "The team has 24 hours to confirm your request. Until then, your rental is not confirmed."}{" "}
        {late
          ? "This is a last-minute rental. Confirmed bookings cannot be cancelled within 48 hours of pickup."
          : "Confirmed bookings can be cancelled more than 48 hours before pickup."}
      </p>
      <label className="av-muted flex gap-3 items-start">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          required
          className="mt-1"
        />
        <span>
          I have read the{" "}
          <a
            className="underline"
            href="/rental-policy"
            target="_blank"
            rel="noreferrer"
          >
            rental terms
          </a>
          , including the cancellation cutoff and collection requirements.
        </span>
      </label>
      {error && (
        <p className="av-alert" role="alert">
          {error}
        </p>
      )}
      <button
        className="av-button"
        disabled={
          !isLoaded ||
          loading ||
          checking ||
          !quote ||
          count === 0 ||
          !accepted ||
          !car.available
        }
      >
        {loading
          ? "Preparing your rental…"
          : !isSignedIn
            ? "Sign in to continue"
            : paymentEnabled
              ? "Continue to demo payment"
              : "Request this rental"}
        <ArrowUpRight size={17} />
      </button>
      <p className="av-muted text-center">
        You can browse and compare cars without signing in.
      </p>
    </form>
  );
}
