import { RentalError } from "./action-result";
export const RENTAL_POLICY = {
  version: "2026-10-31",
  cancellationHours: 48,
  turnaroundMinutes: 60,
  maxRentalDays: 90,
  currency: "usd",
  mileage:
    "Mileage and protection terms are confirmed by the rental team before collection.",
  pickup: "Main collection point",
};

export function validatePeriod(start: Date, end: Date, now = new Date()) {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()))
    throw new RentalError("Choose valid pickup and return dates.");
  if (start <= now) throw new RentalError("Pickup must be in the future.");
  if (end <= start) throw new RentalError("Return must be after pickup.");
  const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  if (days > RENTAL_POLICY.maxRentalDays)
    throw new RentalError(
      "For rentals longer than 90 days, contact the rental team.",
    );
  return days;
}

export function quoteRental(
  rate: number,
  start: Date,
  end: Date,
  now = new Date(),
) {
  const days = validatePeriod(start, end, now);
  if (!Number.isFinite(rate) || rate <= 0)
    throw new RentalError("This vehicle needs a valid rental rate.");
  const dailyCents = Math.round(rate * 100);
  return {
    days,
    dailyCents,
    totalCents: dailyCents * days,
    total: (dailyCents * days) / 100,
  };
}

export function canCancel(start: Date, now = new Date()) {
  return (
    start.getTime() - now.getTime() > RENTAL_POLICY.cancellationHours * 3600000
  );
}

export function bufferedEnd(end: Date) {
  return new Date(end.getTime() + RENTAL_POLICY.turnaroundMinutes * 60000);
}

export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
