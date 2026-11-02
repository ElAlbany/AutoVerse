import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canAssignFleetVehicle,
  fleetHref,
  fleetSegments,
  fleetVehicleState,
  fleetWindow,
  parseFleetDateTime,
  shiftFleetDate,
  type FleetBooking,
  type FleetReservation,
  type FleetVehicle,
} from "../lib/fleet-calendar";
const now = "2026-10-31T12:00:00.000Z";
const order: FleetBooking = {
  id: "booking-a",
  carId: "car-a",
  branchId: "branch-a",
  status: "CONFIRMED",
  startDate: "2026-11-01T10:00:00.000Z",
  endDate: "2026-11-02T10:00:00.000Z",
  expiresAt: null,
  vehicleName: "Test car",
};
const reservation: FleetReservation = {
  id: "r-a",
  orderId: order.id,
  reason: "Rental",
  startDate: order.startDate,
  endDate: "2026-11-02T11:00:00.000Z",
  order,
};
test("calendar windows align to UTC midnight across DST and month boundaries", () => {
  const window = fleetWindow("2026-10-25", 7, new Date(now));
  assert.equal(window.start, "2026-10-25T00:00:00.000Z");
  assert.equal(window.end, "2026-11-01T00:00:00.000Z");
  assert.equal(shiftFleetDate("2026-12-31", 1), "2027-01-01");
  assert.equal(
    fleetWindow("2026-02-30", 999, new Date(now)).date,
    "2026-10-31",
  );
  assert.equal(fleetWindow("2026-02-30", 999, new Date(now)).days, 14);
});
test("calendar navigation retains branch and search filters without retaining the old page", () => {
  const url = new URL(
    fleetHref(
      fleetWindow("2026-10-31", 14, new Date(now)),
      { branchId: "branch-a", search: "Audi & Q7", service: "offline" },
      { date: "2026-11-14" },
    ),
    "https://example.test",
  );
  assert.equal(url.searchParams.get("branchId"), "branch-a");
  assert.equal(url.searchParams.get("search"), "Audi & Q7");
  assert.equal(url.searchParams.get("service"), "offline");
  assert.equal(url.searchParams.get("date"), "2026-11-14");
  assert.equal(url.searchParams.has("page"), false);
});
test("maintenance form times represent UTC instants and reject rolled-over dates", () => {
  assert.equal(
    parseFleetDateTime("2026-10-25T02:30").toISOString(),
    "2026-10-25T02:30:00.000Z",
  );
  for (const value of [
    "2026-02-30T10:00",
    "2026-11-01T25:00",
    "2026-11-01T10:00+02:00",
    "",
  ])
    assert.throws(() => parseFleetDateTime(value));
});
test("the timeline separates preparation, actual early returns and expired holds", () => {
  assert.deepEqual(
    fleetSegments(reservation, now, "2026-11-14T00:00:00.000Z").map((s) => [
      s.kind,
      s.start,
      s.end,
    ]),
    [
      ["rental", order.startDate, order.endDate],
      ["preparation", order.endDate, reservation.endDate],
    ],
  );
  const early = {
    ...reservation,
    endDate: "2026-11-01T18:00:00.000Z",
    order: { ...order, status: "COMPLETED" },
  };
  assert.equal(
    fleetSegments(early, now, "2026-11-14T00:00:00.000Z")[0].start,
    "2026-11-01T17:00:00.000Z",
  );
  assert.equal(
    fleetSegments(
      {
        ...reservation,
        order: {
          ...order,
          status: "PENDING",
          expiresAt: "2026-10-31T11:59:00.000Z",
        },
      },
      now,
      "2026-11-14T00:00:00.000Z",
    ).length,
    0,
  );
});
test("overdue cars stay blocked beyond their stored reservation end", () => {
  const overdue = { ...reservation, order: { ...order, status: "ACTIVE" } };
  assert.equal(
    fleetSegments(
      overdue,
      "2026-11-03T12:00:00.000Z",
      "2026-11-20T00:00:00.000Z",
    )[0].end,
    "2026-11-20T00:00:00.000Z",
  );
  const unit = {
    id: "unit-a",
    code: "AV-1",
    carId: "car-a",
    branchId: "branch-a",
    enabled: true,
    car: {
      make: "Test",
      model: "Car",
      year: 2026,
      available: true,
      archived: false,
    },
    branch: { name: "Branch A", active: true },
    reservations: [overdue],
  } satisfies FleetVehicle;
  assert.equal(
    fleetVehicleState(unit, "2026-11-03T12:00:00.000Z").kind,
    "overdue",
  );
});
test("reassignment choices respect the branch, maintenance, preparation and overdue rentals", () => {
  const unit = {
    id: "unit-b",
    code: "AV-2",
    carId: "car-a",
    branchId: "branch-a",
    reservations: [] as FleetReservation[],
  };
  assert.equal(canAssignFleetVehicle(unit, order, now), true);
  assert.equal(
    canAssignFleetVehicle({ ...unit, branchId: "branch-b" }, order, now),
    false,
  );
  assert.equal(
    canAssignFleetVehicle(
      {
        ...unit,
        reservations: [
          {
            ...reservation,
            orderId: null,
            order: null,
            startDate: "2026-11-02T10:30:00.000Z",
          },
        ],
      },
      order,
      now,
    ),
    false,
    "Preparation is part of the booking period",
  );
  assert.equal(
    canAssignFleetVehicle(
      {
        ...unit,
        reservations: [
          {
            ...reservation,
            orderId: null,
            order: null,
            startDate: "2026-11-02T11:00:00.000Z",
            endDate: "2026-11-02T12:00:00.000Z",
          },
        ],
      },
      order,
      now,
    ),
    true,
    "Half-open boundaries allow adjacent blocks",
  );
  assert.equal(
    canAssignFleetVehicle(
      {
        ...unit,
        reservations: [
          {
            ...reservation,
            orderId: "other",
            order: {
              ...order,
              id: "other",
              status: "ACTIVE",
              endDate: "2026-10-30T10:00:00.000Z",
            },
          },
        ],
      },
      order,
      now,
    ),
    false,
  );
});
