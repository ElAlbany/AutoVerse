import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { lockCar, freeUnitWhere, expireHolds } from "../lib/inventory";
import { bufferedEnd } from "../lib/rental-policy";

// Run only against the explicitly selected development DB. Fixtures are isolated
// by random IDs and cleanup touches only rows created in this test.
test(
  "database inventory remains correct under contention and fragmented availability",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const id = randomUUID();
    const unitA = randomUUID(),
      unitB = randomUUID();
    const start = new Date(Date.now() + 30 * 86400000);
    const end = new Date(start.getTime() + 86400000);
    await prisma.car.create({
      data: {
        id,
        make: "Integration",
        model: "Fixture",
        year: 2026,
        pricePerDay: 50,
        fuel_type: "gas",
        transmission: "a",
        drive: "fwd",
        city_mpg: 20,
        class: "Car",
        combination_mpg: 20,
        cylinders: 4,
        displacement: 2,
        highway_mpg: 25,
        images: [],
        units: {
          create: [
            { id: unitA, code: `TEST-${unitA}` },
            { id: unitB, code: `TEST-${unitB}`, enabled: false },
          ],
        },
      },
    });
    try {
      const reserve = () =>
        prisma.$transaction(
          async (tx) => {
            await lockCar(tx, id);
            const unit = await tx.vehicleUnit.findFirst({
              where: { carId: id, ...freeUnitWhere(start, end) },
            });
            if (!unit) return false;
            await tx.vehicleReservation.create({
              data: {
                unitId: unit.id,
                startDate: start,
                endDate: bufferedEnd(end),
                reason: "Test",
              },
            });
            return true;
          },
          { maxWait: 10000, timeout: 15000 },
        );
      const results = await Promise.all([reserve(), reserve(), reserve()]);
      assert.equal(
        results.filter(Boolean).length,
        1,
        "Only one contender can reserve the last physical car",
      );
      await assert.rejects(
        prisma.vehicleReservation.create({
          data: { unitId: unitA, startDate: start, endDate: end },
        }),
        "Database exclusion rejects a writer that bypasses the app lock",
      );
      assert.equal(
        await prisma.vehicleUnit.count({
          where: {
            carId: id,
            ...freeUnitWhere(end, new Date(end.getTime() + 86400000)),
          },
        }),
        0,
        "Turnaround blocks immediate reuse",
      );
      assert.equal(
        await prisma.vehicleUnit.count({
          where: {
            carId: id,
            ...freeUnitWhere(
              bufferedEnd(end),
              new Date(end.getTime() + 86400000),
            ),
          },
        }),
        1,
        "Exclusive end permits reuse after turnaround",
      );
      await prisma.vehicleReservation.deleteMany({ where: { unitId: unitA } });
      await prisma.vehicleUnit.update({
        where: { id: unitB },
        data: { enabled: true },
      });
      const twoUnits = await Promise.all([reserve(), reserve(), reserve()]);
      assert.equal(
        twoUnits.filter(Boolean).length,
        2,
        "Two physical units permit exactly two simultaneous rentals",
      );
      await prisma.vehicleReservation.deleteMany({
        where: { unitId: { in: [unitA, unitB] } },
      });
      const middle = new Date(start.getTime() + 2 * 86400000),
        finish = new Date(start.getTime() + 4 * 86400000);
      await prisma.vehicleReservation.createMany({
        data: [
          {
            unitId: unitA,
            startDate: start,
            endDate: middle,
            reason: "Test first half",
          },
          {
            unitId: unitB,
            startDate: middle,
            endDate: finish,
            reason: "Test second half",
          },
        ],
      });
      assert.equal(
        await prisma.vehicleUnit.count({
          where: { carId: id, ...freeUnitWhere(start, finish) },
        }),
        0,
        "A whole rental cannot be split across two unavailable units",
      );
    } finally {
      await prisma.vehicleReservation.deleteMany({
        where: { unitId: { in: [unitA, unitB] } },
      });
      await prisma.vehicleUnit.deleteMany({ where: { carId: id } });
      await prisma.car.delete({ where: { id } });
      await prisma.$disconnect();
    }
  },
);
