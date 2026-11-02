import "server-only";
import { prisma } from "./prisma";
import { pageWindow, searchValue } from "./admin-query";
import { currentFreeUnitWhere, freeUnitWhere } from "./inventory";
import { parseFleetDateTime } from "./fleet-calendar";
import { validatePeriod } from "./rental-policy";

// Internal loader: the branch route verifies administrator access first.
export async function loadBranchDetails(
  id: string,
  raw: Record<string, unknown> = {},
) {
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) return null;
  const search = searchValue(raw.search);
  const where = {
    branchId: id,
    archived: false,
    ...(search
      ? {
          OR: [
            { make: { contains: search, mode: "insensitive" as const } },
            { model: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const total = await prisma.car.count({ where });
  const pagination = pageWindow(raw.page, total);
  let start = new Date(Date.now() + 3600000),
    end = new Date(Date.now() + 90000000),
    error = "";
  try {
    if (raw.start) start = parseFleetDateTime(searchValue(raw.start));
    end = raw.end
      ? parseFleetDateTime(searchValue(raw.end))
      : new Date(start.getTime() + 86400000);
    validatePeriod(start, end);
  } catch (e) {
    error = e instanceof Error ? e.message : "Choose valid future dates.";
  }
  const now = new Date();
  const [cars, fleet, availableNow, onHire, upcoming, offline, recentOrders] =
    await Promise.all([
      prisma.car.findMany({
        where,
        orderBy: [{ make: "asc" }, { model: "asc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pagination.size,
        include: {
          _count: {
            select: { units: { where: currentFreeUnitWhere(id, now) } },
          },
        },
      }),
      prisma.car.aggregate({
        where: { branchId: id, archived: false },
        _sum: { quantity: true },
        _count: true,
      }),
      prisma.vehicleUnit.count({
        where: {
          ...currentFreeUnitWhere(id, now),
          car: { archived: false, available: true },
        },
      }),
      prisma.order.count({ where: { branchId: id, status: "ACTIVE" } }),
      prisma.order.count({
        where: { branchId: id, status: "CONFIRMED", endDate: { gt: now } },
      }),
      prisma.vehicleUnit.count({
        where: { branchId: id, enabled: false, car: { archived: false } },
      }),
      prisma.order.findMany({
        where: { branchId: id },
        take: 8,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          vehicleName: true,
          car: { select: { make: true, model: true } },
        },
      }),
    ]);
  const availableForDates = error
    ? []
    : await prisma.vehicleUnit.groupBy({
        by: ["carId"],
        where: {
          ...freeUnitWhere(start, end, id),
          carId: { in: cars.map((car) => car.id) },
          car: { archived: false, available: true },
        },
        _count: true,
      });
  return {
    branch,
    pagination,
    search,
    start: Number.isFinite(start.getTime())
      ? start.toISOString().slice(0, 16)
      : "",
    end: Number.isFinite(end.getTime()) ? end.toISOString().slice(0, 16) : "",
    error,
    stats: {
      models: fleet._count,
      quantity: fleet._sum.quantity || 0,
      availableNow,
      onHire,
      upcoming,
      offline,
    },
    cars: cars.map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      quantity: car.quantity,
      available: car.available,
      price: Number(car.pricePerDay),
      availableNow: car.available && branch.active ? car._count.units : 0,
      availableForDates: error
        ? null
        : availableForDates.find((item) => item.carId === car.id)?._count || 0,
    })),
    recentOrders: recentOrders.map((order) => ({
      ...order,
      startDate: order.startDate.toISOString(),
      endDate: order.endDate.toISOString(),
    })),
  };
}
