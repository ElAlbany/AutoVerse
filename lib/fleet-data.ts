import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fleetWindow, type FleetWorkspaceData } from "@/lib/fleet-calendar";

const bookingSelect = {
  id: true,
  status: true,
  carId: true,
  branchId: true,
  startDate: true,
  endDate: true,
  expiresAt: true,
  vehicleName: true,
} satisfies Prisma.OrderSelect;
const reservationSelect = {
  id: true,
  orderId: true,
  startDate: true,
  endDate: true,
  reason: true,
  order: { select: bookingSelect },
} satisfies Prisma.VehicleReservationSelect;

// Internal server loader; the admin route authenticates before calling it.
export async function getFleetWorkspaceData(
  raw: Record<string, string | string[] | undefined>,
): Promise<FleetWorkspaceData> {
  const params = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [
      key,
      typeof value === "string" ? value : "",
    ]),
  );
  const now = new Date();
  const window = fleetWindow(params.date, params.days, now);
  const start = new Date(window.start),
    end = new Date(window.end);
  const filters = {
    branchId: (params.branchId || "").slice(0, 100),
    search: (params.search || "").trim().slice(0, 100),
    service: ["enabled", "offline"].includes(params.service || "")
      ? params.service!
      : "all",
  };
  const base: Prisma.VehicleUnitWhereInput = {
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.search
      ? {
          OR: [
            { code: { contains: filters.search, mode: "insensitive" } },
            {
              car: {
                OR: [
                  { make: { contains: filters.search, mode: "insensitive" } },
                  { model: { contains: filters.search, mode: "insensitive" } },
                ],
              },
            },
          ],
        }
      : {}),
  };
  const where: Prisma.VehicleUnitWhereInput = {
    ...base,
    ...(filters.service === "all"
      ? {}
      : { enabled: filters.service === "enabled" }),
  };
  const relevant: Prisma.VehicleReservationWhereInput = {
    active: true,
    OR: [
      { orderId: null },
      { order: { status: { in: ["CONFIRMED", "ACTIVE", "COMPLETED"] } } },
      {
        order: {
          status: "PENDING",
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
    ],
  };
  const range: Prisma.VehicleReservationWhereInput = {
    OR: [
      { startDate: { lt: end }, endDate: { gt: start } },
      {
        startDate: { lt: end },
        order: { status: "ACTIVE", endDate: { lt: now } },
      },
    ],
  };
  const attentionBranch: Prisma.OrderWhereInput = filters.branchId
    ? {
        OR: [
          { branchId: filters.branchId },
          {
            branchId: null,
            car: { units: { some: { branchId: filters.branchId } } },
          },
        ],
      }
    : {};
  const conflictWhere: Prisma.OrderWhereInput = {
    ...attentionBranch,
    inventoryConflict: true,
    status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
  };
  const overdueWhere: Prisma.OrderWhereInput = {
    ...attentionBranch,
    status: "ACTIVE",
    endDate: { lt: now },
  };
  const pageSize = 20;
  const [
    total,
    all,
    enabled,
    scheduled,
    cars,
    branches,
    conflicts,
    overdue,
    conflictCount,
    overdueCount,
  ] = await Promise.all([
    prisma.vehicleUnit.count({ where }),
    prisma.vehicleUnit.count({ where: base }),
    prisma.vehicleUnit.count({ where: { ...base, enabled: true } }),
    prisma.vehicleReservation.count({
      where: { AND: [relevant, range], unit: where },
    }),
    prisma.car.findMany({
      where: { archived: false },
      select: { id: true, make: true, model: true, year: true },
      orderBy: [{ make: "asc" }, { model: "asc" }, { id: "asc" }],
    }),
    prisma.branch.findMany({
      select: { id: true, name: true, city: true, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.order.findMany({
      where: conflictWhere,
      select: bookingSelect,
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
      take: 50,
    }),
    prisma.order.findMany({
      where: overdueWhere,
      select: bookingSelect,
      orderBy: [{ endDate: "asc" }, { id: "asc" }],
      take: 50,
    }),
    prisma.order.count({ where: conflictWhere }),
    prisma.order.count({ where: overdueWhere }),
  ]);
  const page = Math.max(
    1,
    Math.min(
      Math.ceil(total / pageSize) || 1,
      Math.floor(Number(params.page) || 1),
    ),
  );
  const units = await prisma.vehicleUnit.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: [{ code: "asc" }, { id: "asc" }],
    select: {
      id: true,
      code: true,
      carId: true,
      branchId: true,
      enabled: true,
      car: {
        select: {
          make: true,
          model: true,
          year: true,
          available: true,
          archived: true,
        },
      },
      branch: { select: { name: true, active: true } },
      reservations: {
        where: {
          AND: [
            relevant,
            {
              OR: [
                range,
                { startDate: { lte: now }, endDate: { gt: now } },
                { order: { status: "ACTIVE", endDate: { lt: now } } },
              ],
            },
          ],
        },
        select: reservationSelect,
        orderBy: { startDate: "asc" },
      },
    },
  });
  const bookings = [
    ...conflicts,
    ...units.flatMap((u) =>
      u.reservations.flatMap((r) => (r.order ? [r.order] : [])),
    ),
  ];
  const earliest = new Date(
    Math.min(start.getTime(), ...bookings.map((o) => o.startDate.getTime())),
  );
  const latest = new Date(
    Math.max(
      end.getTime(),
      ...bookings.map((o) => o.endDate.getTime() + 3600000),
    ),
  );
  const alternatives = bookings.length
    ? await prisma.vehicleUnit.findMany({
        where: {
          enabled: true,
          carId: { in: [...new Set(bookings.map((o) => o.carId))] },
        },
        orderBy: { code: "asc" },
        select: {
          id: true,
          code: true,
          carId: true,
          branchId: true,
          reservations: {
            where: {
              AND: [
                relevant,
                {
                  OR: [
                    { startDate: { lt: latest }, endDate: { gt: earliest } },
                    { order: { status: "ACTIVE", endDate: { lt: now } } },
                  ],
                },
              ],
            },
            select: reservationSelect,
          },
        },
      })
    : [];
  // Only explicitly selected scalar fields cross the server/client boundary.
  const data = JSON.parse(
    JSON.stringify({
      window,
      filters,
      now: now.toISOString(),
      page,
      pageSize,
      total,
      counts: { all, enabled, offline: all - enabled, scheduled },
      cars,
      branches,
      units,
      alternatives,
      attention: { conflicts, overdue, total: conflictCount + overdueCount },
    }),
  ) as FleetWorkspaceData;
  return data;
}
