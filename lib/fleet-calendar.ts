import { RentalError } from "./action-result";
const DAY = 86400000;
export type FleetWindow = {
  date: string;
  start: string;
  end: string;
  days: number;
  today: string;
};
export type FleetBooking = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  expiresAt: string | null;
  vehicleName: string | null;
  carId: string;
  branchId: string | null;
};
export type FleetReservation = {
  id: string;
  orderId: string | null;
  startDate: string;
  endDate: string;
  reason: string;
  order: FleetBooking | null;
};
export type FleetVehicle = {
  id: string;
  code: string;
  carId: string;
  branchId: string;
  enabled: boolean;
  car: {
    make: string;
    model: string;
    year: number;
    available: boolean;
    archived: boolean;
  };
  branch: { name: string; active: boolean };
  reservations: FleetReservation[];
};
export type FleetAlternative = {
  id: string;
  code: string;
  carId: string;
  branchId: string;
  reservations: FleetReservation[];
};
export type FleetFilters = {
  branchId: string;
  search: string;
  service: string;
};
export type FleetWorkspaceData = {
  window: FleetWindow;
  filters: FleetFilters;
  now: string;
  page: number;
  pageSize: number;
  total: number;
  counts: { all: number; enabled: number; offline: number; scheduled: number };
  units: FleetVehicle[];
  alternatives: FleetAlternative[];
  cars: { id: string; make: string; model: string; year: number }[];
  branches: { id: string; name: string; city: string; active: boolean }[];
  attention: {
    conflicts: FleetBooking[];
    overdue: FleetBooking[];
    total: number;
  };
};

export function fleetWindow(
  date?: string,
  days?: string | number,
  now = new Date(),
): FleetWindow {
  const today = now.toISOString().slice(0, 10);
  const parsed =
    date && /^20\d{2}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00.000Z`)
      : null;
  const chosen =
    parsed &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
      ? parsed
      : new Date(`${today}T00:00:00.000Z`);
  const length = [7, 14, 28].includes(Number(days)) ? Number(days) : 14;
  return {
    today,
    date: chosen.toISOString().slice(0, 10),
    start: chosen.toISOString(),
    end: new Date(chosen.getTime() + length * DAY).toISOString(),
    days: length,
  };
}
export function shiftFleetDate(date: string, days: number) {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY)
    .toISOString()
    .slice(0, 10);
}
export function fleetHref(
  window: FleetWindow,
  filters: FleetFilters,
  changes: Record<string, string | number> = {},
) {
  const values: Record<string, string | number> = {
    date: window.date,
    days: window.days,
    ...filters,
    ...changes,
  };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (String(value) && !(key === "service" && value === "all"))
      query.set(key, String(value));
  return `/admin/fleet?${query}`;
}
export function parseFleetDateTime(value: string) {
  const date = new Date(`${value}Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 16) !== value
  )
    throw new RentalError("Choose a valid date and time in UTC.");
  return date;
}
export function fleetDate(value: string, withTime = true) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
export function bookingIsOverdue(order: FleetBooking | null, now: string) {
  return order?.status === "ACTIVE" && order.endDate < now;
}
export type FleetSegment = {
  kind: "rental" | "preparation" | "maintenance" | "overdue" | "hold";
  label: string;
  start: string;
  end: string;
  reservation: FleetReservation;
};
export function fleetSegments(
  reservation: FleetReservation,
  now: string,
  windowEnd: string,
): FleetSegment[] {
  const { order } = reservation;
  const segment = (
    kind: FleetSegment["kind"],
    label: string,
    start = reservation.startDate,
    end = reservation.endDate,
  ): FleetSegment => ({ kind, label, start, end, reservation });
  if (!order)
    return [segment("maintenance", reservation.reason || "Maintenance")];
  if (
    order.status === "CANCELLED" ||
    (order.status === "PENDING" && order.expiresAt && order.expiresAt <= now)
  )
    return [];
  if (bookingIsOverdue(order, now))
    return [
      segment(
        "overdue",
        "Overdue · return needed",
        reservation.startDate,
        windowEnd,
      ),
    ];
  if (order.status === "COMPLETED")
    return [
      segment(
        "preparation",
        "Return preparation",
        new Date(
          Math.max(
            new Date(reservation.startDate).getTime(),
            new Date(reservation.endDate).getTime() - 3600000,
          ),
        ).toISOString(),
      ),
    ];
  const segments = [
    segment(
      order.status === "PENDING" ? "hold" : "rental",
      order.status === "PENDING"
        ? "Checkout hold"
        : order.status === "ACTIVE"
          ? "On rent"
          : "Booked",
      reservation.startDate,
      order.endDate,
    ),
  ];
  if (reservation.endDate > order.endDate)
    segments.push(
      segment("preparation", "Preparation", order.endDate, reservation.endDate),
    );
  return segments;
}
export function fleetVehicleState(unit: FleetVehicle, now: string) {
  if (!unit.enabled) return { kind: "offline", label: "Offline" };
  if (unit.reservations.some((r) => bookingIsOverdue(r.order, now)))
    return { kind: "overdue", label: "Overdue return" };
  const current = unit.reservations
    .flatMap((r) => fleetSegments(r, now, now))
    .find((s) => s.start <= now && s.end > now);
  if (current)
    return {
      kind: current.kind,
      label:
        current.kind === "rental" &&
        current.reservation.order?.status === "CONFIRMED"
          ? "Pickup due"
          : current.label,
    };
  return { kind: "ready", label: "Unreserved now" };
}
export function canAssignFleetVehicle(
  unit: FleetAlternative,
  order: FleetBooking,
  now: string,
) {
  if (
    unit.carId !== order.carId ||
    (order.branchId && unit.branchId !== order.branchId)
  )
    return false;
  const end = new Date(
    new Date(order.endDate).getTime() + 3600000,
  ).toISOString();
  return !unit.reservations.some(
    (r) =>
      r.orderId !== order.id &&
      (bookingIsOverdue(r.order, now) ||
        (r.startDate < end && r.endDate > order.startDate)),
  );
}
