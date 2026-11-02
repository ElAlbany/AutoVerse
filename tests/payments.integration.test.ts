import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { getStripe, settleCheckout } from "../lib/payments";
import { POST } from "../app/api/stripe/webhook/route";

test("sandbox webhook signatures reject tampering and live events", async () => {
  const previousKey = process.env.STRIPE_SECRET_KEY,
    previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_SECRET_KEY = "sk_test_local_fixture";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_local_fixture";
  try {
    const bad = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "invalid" },
        body: "{}",
      }),
    );
    assert.equal(bad.status, 400);
    const payload = JSON.stringify({
      id: "evt_fixture",
      object: "event",
      type: "fixture.noop",
      livemode: false,
      data: { object: {} },
    });
    const signature = getStripe().webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
    assert.equal(
      (
        await POST(
          new Request("http://localhost/api/stripe/webhook", {
            method: "POST",
            headers: { "stripe-signature": signature },
            body: payload,
          }),
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await POST(
          new Request("http://localhost/api/stripe/webhook", {
            method: "POST",
            headers: { "stripe-signature": signature },
            body: payload + " ",
          }),
        )
      ).status,
      400,
    );
    process.env.STRIPE_SECRET_KEY = "sk_live_rejected_fixture";
    assert.throws(() => getStripe(), /sandbox/);
  } finally {
    if (previousKey) process.env.STRIPE_SECRET_KEY = previousKey;
    else delete process.env.STRIPE_SECRET_KEY;
    if (previousSecret) process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    else delete process.env.STRIPE_WEBHOOK_SECRET;
  }
});

test(
  "verified checkout settlement validates totals and safely replays duplicate events",
  { skip: process.env.RUN_DB_TESTS !== "1" },
  async () => {
    const id = randomUUID(),
      userId = randomUUID(),
      unitId = randomUUID(),
      orderId = randomUUID();
    const eventId = `evt_fixture_${id}`,
      sessionId = `cs_test_fixture_${id}`;
    const start = new Date(Date.now() + 45 * 86400000),
      end = new Date(start.getTime() + 86400000);
    await prisma.user.create({
      data: {
        id: userId,
        clerkId: `fixture-${id}`,
        email: `fixture-${id}@example.test`,
      },
    });
    await prisma.car.create({
      data: {
        id,
        make: "Integration",
        model: "Payments fixture",
        year: 2026,
        pricePerDay: 100,
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
        units: { create: { id: unitId, code: `TEST-${unitId}` } },
      },
    });
    try {
      await prisma.order.create({
        data: {
          id: orderId,
          userId,
          carId: id,
          startDate: start,
          endDate: end,
          totalPrice: 100,
          stripeSessionId: sessionId,
          expiresAt: new Date(Date.now() + 600000),
          reservation: { create: { unitId, startDate: start, endDate: end } },
        },
      });
      const session = {
        id: sessionId,
        livemode: false,
        amount_total: 10000,
        currency: "usd",
        client_reference_id: orderId,
        payment_status: "paid",
        status: "complete",
        payment_intent: "pi_fixture_not_used_for_external_calls",
      } as Stripe.Checkout.Session;
      await assert.rejects(
        settleCheckout({ ...session, amount_total: 1 }, `${eventId}_wrong`),
        /quote/,
      );
      assert.equal(
        (await prisma.order.findUniqueOrThrow({ where: { id: orderId } }))
          .status,
        "PENDING",
      );
      await settleCheckout(session, eventId);
      await settleCheckout(session, eventId);
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: orderId },
      });
      assert.equal(order.status, "CONFIRMED");
      assert.equal(order.paymentStatus, "PAID");
      assert.equal(await prisma.orderEvent.count({ where: { orderId } }), 1);
      assert.equal(
        await prisma.notification.count({
          where: { key: `${orderId}:CONFIRMED` },
        }),
        1,
      );
    } finally {
      await prisma.notification.deleteMany({
        where: { key: { startsWith: orderId } },
      });
      await prisma.webhookEvent.deleteMany({
        where: { id: { startsWith: eventId } },
      });
      await prisma.orderEvent.deleteMany({ where: { orderId } });
      await prisma.vehicleReservation.deleteMany({ where: { unitId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
      await prisma.vehicleUnit.deleteMany({ where: { carId: id } });
      await prisma.car.delete({ where: { id } });
      await prisma.user.delete({ where: { id: userId } });
      await prisma.$disconnect();
    }
  },
);
