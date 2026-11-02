import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { bookForUser, cancelBookingForUser } from "../lib/booking";
import { transitionRental } from "../lib/rental-lifecycle";
import { writeReview } from "../lib/reviews";
import { settleCheckout } from "../lib/payments";
import { freeUnitWhere } from "../lib/inventory";
import { findChatInventory } from "../lib/chat-inventory";

// These tests call the production services against isolated development DB rows.
// External financial effects are replaced explicitly; notification jobs are never delivered.
test("booking, staff return, review and checkout lifecycles", { skip: process.env.RUN_DB_TESTS !== "1" }, async (t) => {
  const tag = randomUUID();
  const carId = randomUUID(), owner = randomUUID(), other = randomUUID(), admin = randomUUID();
  const branchA = randomUUID(), branchB = randomUUID(), unitA = randomUUID(), unitB = randomUUID();
  const noEffects = { refund: async () => {}, expire: async () => {} };
  const now = Date.now();
  const at = (days: number) => new Date(now + days * 86400000);
  const input = (days: number, branchId = branchA) => ({ carId, branchId, start: at(days).toISOString(), end: at(days + 1).toISOString(), requestKey: randomUUID(), payment: false });
  await prisma.$transaction([
    ...[owner, other, admin].map((id) => prisma.user.create({ data: { id, clerkId: `test-${id}`, email: `${id}@example.test`, role: id === admin ? "ADMIN" : "USER" } })),
    ...[branchA, branchB].map((id) => prisma.branch.create({ data: { id, name: `Lifecycle ${id}`, city: "Fixture" } })),
    prisma.car.create({ data: { id: carId, make: "Fixture", model: tag, year: 2026, pricePerDay: 50, fuel_type: "gas", transmission: "a", drive: "fwd", city_mpg: 20, class: "Car", combination_mpg: 20, cylinders: 4, displacement: 2, highway_mpg: 25, images: [], seats: 5 } }),
    prisma.vehicleUnit.create({ data: { id: unitA, carId, branchId: branchA, code: `TEST-${unitA}` } }),
    prisma.vehicleUnit.create({ data: { id: unitB, carId, branchId: branchB, code: `TEST-${unitB}` } }),
  ]);
  try {
    await t.test("concurrent retries book once, enforce branch stock and cancellation ownership", async () => {
      const request = input(30);
      const [first, retry] = await Promise.all([bookForUser(request, owner), bookForUser(request, owner)]);
      assert.equal(first.orderId, retry.orderId);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: first.orderId } });
      assert.equal(order.status, "CONFIRMED");
      assert.equal(order.expiresAt, null);
      assert.equal(await prisma.notification.count({ where: { key: `${order.id}:CONFIRMED` } }), 1);
      await assert.rejects(bookForUser({ ...request, requestKey: randomUUID() }, other), /available/i);
      await assert.rejects(bookForUser(request, other), /different rental/);
      await assert.rejects(bookForUser({ ...request, start: at(31).toISOString() }, owner), /different rental/);
      const elsewhere = await bookForUser({ ...request, branchId: branchB, requestKey: randomUUID() }, other);
      await assert.rejects(cancelBookingForUser(order.id, other, noEffects), /not found/);
      await cancelBookingForUser(order.id, owner, noEffects);
      await cancelBookingForUser(order.id, owner, noEffects);
      assert.equal((await prisma.vehicleReservation.findUniqueOrThrow({ where: { orderId: order.id } })).active, false);
      assert.equal(await prisma.orderEvent.count({ where: { orderId: order.id, message: "Customer cancelled the booking." } }), 1);
      await cancelBookingForUser(elsewhere.orderId, other, noEffects);
      const soon = await bookForUser(input(1), owner);
      await assert.rejects(cancelBookingForUser(soon.orderId, owner, noEffects), /48 hours/);
      await transitionRental(soon.orderId, "CANCELLED", admin, noEffects);
    });

    await t.test("staff permissions, late collection, return conflicts and verified review editing", async () => {
      const ended = await prisma.order.create({ data: { userId: owner, carId, branchId: branchA, startDate: at(-2), endDate: at(-1), status: "CONFIRMED", totalPrice: 50, reservation: { create: { unitId: unitA, startDate: at(-2), endDate: at(-1) } } } });
      await assert.rejects(transitionRental(ended.id, "ACTIVE", other, noEffects), /Administrator/);
      await assert.rejects(transitionRental(ended.id, "ACTIVE", admin, noEffects), /period has ended/);
      await assert.rejects(writeReview(owner, ended.id, 5, "Premature"), /completed/);
      const late = await prisma.order.create({ data: { userId: owner, carId, branchId: branchA, startDate: new Date(now - 2 * 3600000), endDate: new Date(now - 1800000), status: "ACTIVE", totalPrice: 50, reservation: { create: { unitId: unitA, startDate: new Date(now - 2 * 3600000), endDate: new Date(now + 1800000) } } } });
      const maintenance = await prisma.vehicleReservation.create({ data: { unitId: unitA, startDate: new Date(now + 45 * 60000), endDate: new Date(now + 2 * 3600000), reason: "Fixture maintenance" } });
      await assert.rejects(transitionRental(late.id, "COMPLETED", admin, noEffects), /preparation overlaps/);
      assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: late.id } })).status, "ACTIVE", "Conflict rolls back the status change");
      await prisma.vehicleReservation.update({ where: { id: maintenance.id }, data: { active: false } });
      await transitionRental(late.id, "COMPLETED", admin, noEffects);
      await transitionRental(late.id, "COMPLETED", admin, noEffects);
      assert.equal(await prisma.orderEvent.count({ where: { orderId: late.id } }), 1);
      assert.equal(await prisma.vehicleUnit.count({ where: { id: unitA, ...freeUnitWhere(new Date(now + 30 * 60000), at(0.5), branchA) } }), 0);
      assert.equal(await prisma.vehicleUnit.count({ where: { id: unitA, ...freeUnitWhere(new Date(now + 65 * 60000), at(0.5), branchA) } }), 1);
      await assert.rejects(writeReview(other, late.id, 5, "Not mine"), /completed/);
      await assert.rejects(writeReview(owner, late.id, 6, "Invalid"), /rating/);
      await writeReview(owner, late.id, 5, "  Great rental  ");
      await prisma.review.update({ where: { orderId: late.id }, data: { hidden: true, moderationReason: "Fixture moderation" } });
      await writeReview(owner, late.id, 4, "Updated rental");
      const review = await prisma.review.findUniqueOrThrow({ where: { orderId: late.id } });
      assert.equal(review.hidden, true);
      assert.equal(review.rating, 4);
      assert.equal(await prisma.review.count({ where: { orderId: late.id } }), 1);
      await prisma.review.update({ where: { orderId: late.id }, data: { createdAt: at(-15) } });
      await assert.rejects(writeReview(owner, late.id, 5, "Too late"), /14 days/);
    });

    await t.test("cancellation during checkout creation cannot revive stock; late payment queues refund once", async () => {
      let checkoutOrder = "", expired = "";
      const sessionId = `cs_test_${tag}`;
      const gateway = { checkout: { sessions: {
        create: async (params: Stripe.Checkout.SessionCreateParams) => {
          checkoutOrder = String(params.metadata!.orderId);
          await cancelBookingForUser(checkoutOrder, owner, noEffects);
          return { id: sessionId, expires_at: Math.floor(Date.now() / 1000) + 1800, url: "https://checkout.stripe.com/fixture" };
        },
        expire: async (id: string) => { expired = id; },
      } } } as unknown as Stripe;
      const result = await bookForUser({ ...input(40), payment: true }, owner, { stripe: gateway });
      assert.equal(result.url, `/profile/orders/${checkoutOrder}`);
      assert.equal(expired, sessionId);
      const cancelled = await prisma.order.findUniqueOrThrow({ where: { id: checkoutOrder }, include: { reservation: true } });
      assert.equal(cancelled.status, "CANCELLED");
      assert.equal(cancelled.stripeSessionId, sessionId);
      assert.equal(cancelled.reservation?.active, false);
      const paid = { id: sessionId, livemode: false, payment_status: "paid", amount_total: 5000, currency: "usd", client_reference_id: checkoutOrder, payment_intent: `pi_${tag}` } as Stripe.Checkout.Session;
      await settleCheckout(paid, `evt_${tag}`, async () => {});
      const count = await prisma.orderEvent.count({ where: { orderId: checkoutOrder } });
      await settleCheckout(paid, `evt_${tag}`, async () => {});
      const settled = await prisma.order.findUniqueOrThrow({ where: { id: checkoutOrder }, include: { reservation: true } });
      assert.equal(settled.paymentStatus, "REFUND_PENDING");
      assert.equal(settled.status, "CANCELLED");
      assert.equal(settled.reservation?.active, false);
      assert.equal(await prisma.orderEvent.count({ where: { orderId: checkoutOrder } }), count);
    });

    await t.test("expired holds release inventory and chatbot respects branch, seats and dates", async () => {
      const request = input(20);
      const expired = await prisma.order.create({ data: { userId: owner, carId, branchId: branchA, startDate: at(20), endDate: at(21), totalPrice: 50, status: "PENDING", expiresAt: at(-1), reservation: { create: { unitId: unitA, startDate: at(20), endDate: at(21.1) } } } });
      await bookForUser(request, owner);
      assert.equal((await prisma.order.findUniqueOrThrow({ where: { id: expired.id } })).status, "CANCELLED");
      const query = { messages: [{ role: "user" as const, content: "Find a car" }], start: request.start, end: request.end, period: true, passengers: 5, branchId: branchA };
      assert.equal((await findChatInventory(query)).length, 0);
      assert.deepEqual((await findChatInventory({ ...query, branchId: branchB })).map((car) => car.id), [carId]);
      assert.equal((await findChatInventory({ ...query, branchId: branchB, passengers: 6 })).length, 0);
      await prisma.branch.update({ where: { id: branchA }, data: { active: false } });
      await assert.rejects(bookForUser(input(50), owner), /branch is not accepting/);
      assert.equal((await findChatInventory({ ...query, period: false })).length, 0);
    });
  } finally {
    const orders = await prisma.order.findMany({ where: { carId }, select: { id: true } });
    await prisma.$transaction([
      prisma.notification.deleteMany({ where: { OR: orders.map(({ id }) => ({ key: { startsWith: `${id}:` } })) } }),
      prisma.review.deleteMany({ where: { carId } }),
      prisma.vehicleReservation.deleteMany({ where: { unitId: { in: [unitA, unitB] } } }),
      prisma.orderEvent.deleteMany({ where: { orderId: { in: orders.map(({ id }) => id) } } }),
      prisma.order.deleteMany({ where: { carId } }),
      prisma.vehicleUnit.deleteMany({ where: { carId } }),
      prisma.car.delete({ where: { id: carId } }),
      prisma.user.deleteMany({ where: { id: { in: [owner, other, admin] } } }),
      prisma.branch.deleteMany({ where: { id: { in: [branchA, branchB] } } }),
      prisma.rateLimit.deleteMany({ where: { key: { in: [owner, other].map((id) => `booking:${id}`) } } }),
      prisma.webhookEvent.deleteMany({ where: { id: `evt_${tag}` } }),
    ]);
    await prisma.$disconnect();
  }
});
