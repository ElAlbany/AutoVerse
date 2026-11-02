import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { availableUnits, freeUnitWhere, lockCar } from "../lib/inventory";
import { bufferedEnd } from "../lib/rental-policy";

test(
  "branch stock stays isolated through contention, cancellation, returns and closure",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const carId = randomUUID(),
      userId = randomUUID(),
      a = randomUUID(),
      b = randomUUID(),
      unitId = randomUUID();
    const start = new Date(Date.now() + 40 * 86400000),
      end = new Date(start.getTime() + 86400000);
    try {
      await prisma.branch.createMany({
        data: [
          { id: a, name: `Tirana-${a}`, city: "Tirana" },
          { id: b, name: `Brussels-${b}`, city: "Brussels" },
        ],
      });
      await prisma.user.create({
        data: {
          id: userId,
          clerkId: `fixture-${userId}`,
          email: `${userId}@example.test`,
        },
      });
      await prisma.car.create({
        data: {
          id: carId,
          branchId: a,
          make: "Integration",
          model: "Branch fixture",
          year: 2026,
          pricePerDay: 50,
          seats: 4,
          class: "Car",
          fuel_type: "gas",
          transmission: "a",
          drive: "fwd",
          city_mpg: 20,
          highway_mpg: 25,
          combination_mpg: 22,
          cylinders: 4,
          displacement: 2,
          images: [],
          units: {
            create: { id: unitId, code: `TEST-${unitId}`, branchId: a },
          },
        },
      });
      assert.equal(await availableUnits(carId, start, end, a), 1);
      assert.equal(
        await availableUnits(carId, start, end, b),
        0,
        "An empty branch cannot borrow another branch's car",
      );
      const reserve = (branchId: string) =>
        prisma.$transaction(
          async (tx) => {
            await lockCar(tx, carId);
            const unit = await tx.vehicleUnit.findFirst({
              where: { carId, ...freeUnitWhere(start, end, branchId) },
            });
            if (!unit) return null;
            return tx.order.create({
              data: {
                carId,
                userId,
                branchId,
                startDate: start,
                endDate: end,
                totalPrice: 50,
                status: "CONFIRMED",
                reservation: {
                  create: {
                    unitId: unit.id,
                    startDate: start,
                    endDate: bufferedEnd(end),
                  },
                },
              },
            });
          },
          { maxWait: 10000, timeout: 15000 },
        );
      const results = await Promise.all([reserve(a), reserve(a), reserve(b)]);
      assert.equal(results.filter(Boolean).length, 1);
      const order = results.find(Boolean)!;
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        }),
        prisma.vehicleReservation.update({
          where: { orderId: order.id },
          data: { active: false },
        }),
      ]);
      assert.equal(
        await availableUnits(carId, start, end, a),
        1,
        "Cancellation releases stock at the booked branch",
      );
      const returned = (await reserve(a))!;
      await prisma.order.update({
        where: { id: returned.id },
        data: { status: "COMPLETED" },
      });
      assert.equal(
        await availableUnits(carId, end, new Date(end.getTime() + 86400000), a),
        0,
        "Completed rental still reserves preparation time",
      );
      assert.equal(
        await availableUnits(
          carId,
          bufferedEnd(end),
          new Date(end.getTime() + 86400000),
          a,
        ),
        1,
      );
      await prisma.branch.update({ where: { id: a }, data: { active: false } });
      assert.equal(
        await availableUnits(
          carId,
          bufferedEnd(end),
          new Date(end.getTime() + 86400000),
          a,
        ),
        0,
        "Closed branches do not allocate new rentals",
      );
    } finally {
      await prisma.vehicleReservation.deleteMany({ where: { unitId } });
      await prisma.order.deleteMany({ where: { carId } });
      await prisma.vehicleUnit.deleteMany({ where: { carId } });
      await prisma.car.deleteMany({ where: { id: carId } });
      await prisma.user.deleteMany({ where: { id: userId } });
      await prisma.branch.deleteMany({ where: { id: { in: [a, b] } } });
      await prisma.$disconnect();
    }
  },
);
