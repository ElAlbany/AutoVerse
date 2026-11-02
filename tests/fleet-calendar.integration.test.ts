import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { getFleetWorkspaceData } from "../lib/fleet-data";
import { fleetVehicleState } from "../lib/fleet-calendar";

test(
  "fleet queries paginate all physical units and retain current state outside the selected period",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const branchId = randomUUID(),
      carId = randomUUID(),
      userId = randomUUID(),
      prefix = randomUUID();
    const units = Array.from({ length: 21 }, (_, i) => ({
      id: randomUUID(),
      carId,
      branchId,
      code: `TEST-${prefix}-${String(i).padStart(2, "0")}`,
      enabled: i !== 20,
    }));
    const now = Date.now();
    const day = 86400000;
    const future = new Date(now + 10 * day);
    const futureEnd = new Date(now + 12 * day);
    try {
      await prisma.branch.create({
        data: { id: branchId, name: `Test fleet ${prefix}`, city: "Test" },
      });
      await prisma.car.create({
        data: {
          id: carId,
          branchId,
          make: `Fixture-${prefix}`,
          model: "Calendar",
          year: 2026,
          pricePerDay: 50,
          seats: 5,
          fuel_type: "gas",
          transmission: "a",
          drive: "fwd",
          class: "Car",
          city_mpg: 20,
          highway_mpg: 25,
          combination_mpg: 22,
          cylinders: 4,
          displacement: 2,
          images: [],
        },
      });
      await prisma.vehicleUnit.createMany({ data: units });
      await prisma.user.create({
        data: {
          id: userId,
          clerkId: `fixture-${prefix}`,
          email: `${prefix}@example.test`,
        },
      });
      await prisma.order.create({
        data: {
          userId,
          carId,
          branchId,
          status: "ACTIVE",
          startDate: new Date(now - 3 * day),
          endDate: new Date(now - day),
          totalPrice: 100,
          reservation: {
            create: {
              unitId: units[0].id,
              startDate: new Date(now - 3 * day),
              endDate: new Date(now - day + 3600000),
            },
          },
        },
      });
      await prisma.order.create({
        data: {
          userId,
          carId,
          branchId,
          status: "CONFIRMED",
          startDate: future,
          endDate: futureEnd,
          totalPrice: 100,
          reservation: {
            create: {
              unitId: units[1].id,
              startDate: future,
              endDate: new Date(futureEnd.getTime() + 3600000),
            },
          },
        },
      });
      await prisma.vehicleReservation.create({
        data: {
          unitId: units[2].id,
          startDate: new Date(now - 3600000),
          endDate: new Date(now + 3600000),
          reason: "Test maintenance now",
        },
      });
      const data = await getFleetWorkspaceData({
        branchId,
        date: new Date(now + 7 * day).toISOString().slice(0, 10),
        days: "14",
      });
      assert.equal(data.total, 21);
      assert.equal(data.units.length, 20);
      assert.equal(data.counts.all, 21);
      assert.equal(data.counts.enabled, 20);
      assert.equal(data.counts.offline, 1);
      assert.equal(
        data.counts.scheduled,
        2,
        "Only the future booking and overdue occupation belong to this future view",
      );
      const currentMaintenance = data.units.find((u) => u.id === units[2].id)!;
      assert.equal(
        fleetVehicleState(currentMaintenance, data.now).kind,
        "maintenance",
        "Current status must still reflect maintenance outside the selected future period",
      );
      const page2 = await getFleetWorkspaceData({ branchId, page: "999" });
      assert.equal(page2.page, 2);
      assert.equal(page2.units.length, 1);
      assert.equal(page2.units[0].id, units[20].id);
      const offline = await getFleetWorkspaceData({
        branchId,
        service: "offline",
      });
      assert.equal(offline.total, 1);
      assert.equal(offline.counts.all, 21);
      const past = await getFleetWorkspaceData({
        branchId,
        date: new Date(now - 30 * day).toISOString().slice(0, 10),
        days: "7",
      });
      assert.equal(
        past.counts.scheduled,
        0,
        "An overdue rental that started later is not an event in an earlier historical week",
      );
      assert.equal(
        fleetVehicleState(
          past.units.find((u) => u.id === units[0].id)!,
          past.now,
        ).kind,
        "overdue",
        "Current vehicle status remains accurate even while viewing history",
      );
      assert.equal(
        past.attention.overdue.length,
        1,
        "Exceptions remain visible independently of the selected dates",
      );
    } finally {
      await prisma.vehicleReservation.deleteMany({
        where: { unitId: { in: units.map((u) => u.id) } },
      });
      await prisma.order.deleteMany({ where: { carId } });
      await prisma.vehicleUnit.deleteMany({ where: { carId } });
      await prisma.car.deleteMany({ where: { id: carId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.branch.deleteMany({ where: { id: branchId } });
      await prisma.$disconnect();
    }
  },
);
