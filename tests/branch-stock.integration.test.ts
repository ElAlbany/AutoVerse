import { loadBranchDetails } from "../lib/branch-data";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";
import { saveBranchListing } from "../lib/car-stock";
import { availableUnits, currentFreeUnitWhere } from "../lib/inventory";
import { bookForUser, cancelBookingForUser } from "../lib/booking";
import { transitionRental } from "../lib/rental-lifecycle";

test(
  "branch-owned catalogues and numeric fleet stock remain correct through rentals and concurrent edits",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const a = randomUUID(),
      b = randomUUID(),
      userId = randomUUID();
    const cars: string[] = [];
    const details = {
      make: "Audi",
      model: "A5",
      year: 2026,
      pricePerDay: 50,
      seats: 5,
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
    };
    const now = Date.now(),
      start = new Date(now + 30 * 86400000),
      end = new Date(now + 31 * 86400000);
    const effects = { refund: async () => {}, expire: async () => {} };
    try {
      await prisma.branch.createMany({
        data: [
          { id: a, name: `Stock Frankfurt ${a}`, city: "Frankfurt" },
          { id: b, name: `Stock Tirana ${b}`, city: "Tirana" },
        ],
      });
      await prisma.user.create({
        data: {
          id: userId,
          role: "ADMIN",
          clerkId: `test-${userId}`,
          email: `${userId}@example.test`,
        },
      });
      const first = await saveBranchListing({
        branchId: a,
        quantity: 3,
        data: details,
      });
      cars.push(first.id);
      const second = await saveBranchListing({
        branchId: b,
        quantity: 5,
        data: details,
      });
      cars.push(second.id);
      const third = await saveBranchListing({
        branchId: b,
        quantity: 0,
        data: { ...details, model: "A7" },
      });
      cars.push(third.id);
      assert.notEqual(
        first.id,
        second.id,
        "The same model has independent branch listings",
      );
      assert.equal(await prisma.car.count({ where: { branchId: a } }), 1);
      assert.equal(await prisma.car.count({ where: { branchId: b } }), 2);
      assert.equal(first.quantity, 3);
      assert.equal(second.quantity, 5);
      await saveBranchListing({
        id: first.id,
        branchId: a,
        quantity: 3,
        data: details,
      });
      assert.equal(
        await prisma.vehicleUnit.count({ where: { carId: first.id } }),
        3,
        "Saving unchanged stock does not create instances",
      );
      await assert.rejects(
        saveBranchListing({
          id: first.id,
          branchId: b,
          quantity: 1,
          data: details,
        }),
        /belongs to one branch/,
      );
      await assert.rejects(
        prisma.vehicleUnit.create({
          data: { carId: first.id, branchId: b, code: `TEST-${randomUUID()}` },
        }),
        /Foreign key|constraint/i,
      );
      await assert.rejects(
        prisma.order.create({
          data: {
            carId: first.id,
            branchId: b,
            userId,
            startDate: start,
            endDate: end,
            totalPrice: 50,
          },
        }),
        /Foreign key|constraint/i,
      );
      const unit = await prisma.vehicleUnit.findFirstOrThrow({
        where: { carId: first.id },
      });
      const active = await prisma.order.create({
        data: {
          carId: first.id,
          branchId: a,
          userId,
          startDate: new Date(now - 2 * 3600000),
          endDate: new Date(now + 86400000),
          totalPrice: 50,
          status: "ACTIVE",
          reservation: {
            create: {
              unitId: unit.id,
              startDate: new Date(now - 2 * 3600000),
              endDate: new Date(now + 90000000),
            },
          },
        },
      });
      assert.equal(
        await prisma.vehicleUnit.count({
          where: { carId: first.id, ...currentFreeUnitWhere(a) },
        }),
        2,
        "Three instances with one collected car means two available now",
      );
      const summary = await loadBranchDetails(a);
      assert.equal(summary?.stats.models, 1);
      assert.equal(summary?.stats.quantity, 3);
      assert.equal(summary?.stats.availableNow, 2);
      assert.equal(summary?.stats.onHire, 1);
      assert.deepEqual(
        summary?.cars.map((car) => car.id),
        [first.id],
      );
      assert.equal((await loadBranchDetails(b))?.stats.models, 2);
      const request = () => ({
        carId: first.id,
        branchId: a,
        start: start.toISOString(),
        end: end.toISOString(),
        expectedTotalCents: 5000,
        requestKey: randomUUID(),
        payment: false,
      });
      await assert.rejects(
        bookForUser({ ...request(), branchId: b }, userId),
        /different collection branch/,
      );
      const attempts = await Promise.allSettled(
        Array.from({ length: 4 }, () => bookForUser(request(), userId)),
      );
      const booked = attempts.filter((result) => result.status === "fulfilled");
      assert.equal(
        booked.length,
        3,
        "Only three overlapping rentals fit three physical instances",
      );
      assert.equal(await availableUnits(first.id, start, end, a), 0);
      assert.equal(
        await availableUnits(second.id, start, end, b),
        5,
        "Frankfurt rentals do not consume Tirana stock",
      );
      await assert.rejects(
        saveBranchListing({
          id: first.id,
          branchId: a,
          quantity: 2,
          data: details,
        }),
        /active or upcoming/,
      );
      for (const result of booked)
        await cancelBookingForUser(result.value.orderId, userId, effects);
      assert.equal(await availableUnits(first.id, start, end, a), 3);
      const reduced = await saveBranchListing({
        id: first.id,
        branchId: a,
        quantity: 1,
        data: details,
      });
      assert.equal(reduced.quantity, 1);
      await assert.rejects(
        saveBranchListing({
          id: first.id,
          branchId: a,
          quantity: 0,
          data: details,
        }),
        /active or upcoming/,
      );
      await transitionRental(active.id, "COMPLETED", userId, effects);
      assert.equal(
        await prisma.vehicleUnit.count({
          where: { carId: first.id, ...currentFreeUnitWhere(a) },
        }),
        0,
        "Return preparation still occupies the remaining unit",
      );
      assert.equal(
        await prisma.vehicleUnit.count({
          where: {
            carId: first.id,
            ...currentFreeUnitWhere(a, new Date(now + 65 * 60000)),
          },
        }),
        1,
      );
      // Simulate elapsed preparation only on this fixture, preserving its rental history.
      await prisma.vehicleReservation.update({
        where: { orderId: active.id },
        data: { endDate: new Date(now - 60000) },
      });
      assert.equal(
        (
          await saveBranchListing({
            id: first.id,
            branchId: a,
            quantity: 0,
            data: details,
          })
        ).quantity,
        0,
      );
      assert.equal(
        await prisma.order.count({ where: { carId: first.id } }),
        4,
        "Reducing stock preserves orders",
      );
      await saveBranchListing({
        id: first.id,
        branchId: a,
        quantity: 4,
        data: details,
      });
      await Promise.all(
        [3, 5].map((quantity) =>
          saveBranchListing({
            id: first.id,
            branchId: a,
            quantity,
            data: details,
          }),
        ),
      );
      const fresh = await prisma.car.findUniqueOrThrow({
        where: { id: first.id },
      });
      assert.ok([3, 5].includes(fresh.quantity));
      assert.equal(
        fresh.quantity,
        await prisma.vehicleUnit.count({
          where: { carId: first.id, enabled: true },
        }),
      );
      const racing = await Promise.allSettled([
        saveBranchListing({
          id: first.id,
          branchId: a,
          quantity: 0,
          data: details,
        }),
        bookForUser(request(), userId),
      ]);
      assert.equal(
        racing.filter((result) => result.status === "fulfilled").length,
        1,
        "A concurrent stock reduction cannot remove a newly booked instance",
      );
      await prisma.branch.update({ where: { id: b }, data: { active: false } });
      assert.equal(await availableUnits(second.id, start, end, b), 0);
    } finally {
      const orders = await prisma.order.findMany({
        where: { carId: { in: cars } },
        select: { id: true },
      });
      await prisma.$transaction([
        prisma.notification.deleteMany({
          where: {
            OR: orders.map(({ id }) => ({ key: { startsWith: `${id}:` } })),
          },
        }),
        prisma.vehicleReservation.deleteMany({
          where: { unit: { carId: { in: cars } } },
        }),
        prisma.orderEvent.deleteMany({
          where: { orderId: { in: orders.map(({ id }) => id) } },
        }),
        prisma.order.deleteMany({ where: { carId: { in: cars } } }),
        prisma.vehicleUnit.deleteMany({ where: { carId: { in: cars } } }),
        prisma.car.deleteMany({ where: { id: { in: cars } } }),
        prisma.user.deleteMany({ where: { id: userId } }),
        prisma.rateLimit.deleteMany({ where: { key: `booking:${userId}` } }),
        prisma.branch.deleteMany({ where: { id: { in: [a, b] } } }),
      ]);
      await prisma.$disconnect();
    }
  },
);
