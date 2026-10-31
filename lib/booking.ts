import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";
import { requireUser } from "./auth";
import { expireHolds, freeUnitWhere, lockCar } from "./inventory";
import {
  bufferedEnd,
  canCancel,
  quoteRental,
  RENTAL_POLICY,
} from "./rental-policy";
import { appUrl, getStripe, refundOrder } from "./payments";
import { queueOrderEmail } from "./notifications";
import { rateLimit } from "./rate-limit";

export type BookingInput = {
  carId: string;
  branchId?: string;
  start: string;
  end: string;
  requestKey: string;
  payment: boolean;
};

export async function book(input: BookingInput) {
  const user = await requireUser();
  await rateLimit(`booking:${user.id}`, 15);
  if (!input.carId || !/^[a-zA-Z0-9-]{16,100}$/.test(input.requestKey))
    throw new Error("Invalid booking request.");
  const start = new Date(input.start);
  const end = new Date(input.end);
  const stripe = input.payment ? getStripe() : null;
  const origin = input.payment ? appUrl() : "";
  const order = await prisma.$transaction(
    async (tx) => {
      await lockCar(tx, input.carId);
      await expireHolds(tx, input.carId);
      const previous = await tx.order.findUnique({
        where: { requestKey: input.requestKey },
      });
      if (previous) {
        if (
          previous.userId !== user.id ||
          previous.carId !== input.carId ||
          (!!input.branchId && previous.branchId !== input.branchId) ||
          previous.startDate.getTime() !== start.getTime() ||
          previous.endDate.getTime() !== end.getTime()
        )
          throw new Error("This request belongs to a different rental.");
        if (previous.status === "CANCELLED")
          throw new Error("This checkout has expired. Start a new booking.");
        return previous;
      }
      const car = await tx.car.findUnique({ where: { id: input.carId } });
      if (!car || car.archived || !car.available)
        throw new Error("This car is not currently accepting bookings.");
      let branchId = input.branchId;
      if (!branchId) {
        const choices = await tx.vehicleUnit.findMany({
          where: { carId: car.id, enabled: true, branch: { active: true } },
          select: { branchId: true },
          distinct: ["branchId"],
          take: 2,
        });
        if (choices.length !== 1)
          throw new Error("Select a collection branch before booking.");
        branchId = choices[0].branchId;
      }
      await tx.$queryRaw`SELECT id FROM "Branch" WHERE id = ${branchId} FOR SHARE`;
      const branch = await tx.branch.findFirst({
        where: { id: branchId, active: true },
      });
      if (!branch)
        throw new Error("This collection branch is not accepting bookings.");
      const quote = quoteRental(Number(car.pricePerDay), start, end);
      const unit = await tx.vehicleUnit.findFirst({
        where: { carId: car.id, ...freeUnitWhere(start, end, branch.id) },
        orderBy: { code: "asc" },
      });
      if (!unit)
        throw new Error(
          "No vehicle is available for the entire period. Try different dates or another car.",
        );
      const created = await tx.order.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          carId: car.id,
          branchId: branch.id,
          startDate: start,
          endDate: end,
          totalPrice: quote.total,
          dailyRate: Number(car.pricePerDay),
          currency: RENTAL_POLICY.currency,
          vehicleName: `${car.year} ${car.make} ${car.model}`,
          policy: {
            ...RENTAL_POLICY,
            location: `${branch.name} · ${branch.city}`,
            collectionAddress: branch.address,
            payment: input.payment ? "stripe-sandbox" : "pay-at-collection",
          },
          requestKey: input.requestKey,
          status: input.payment ? "PENDING" : "CONFIRMED",
          expiresAt: input.payment ? new Date(Date.now() + 31 * 60000) : null,
          reservation: {
            create: {
              unitId: unit.id,
              startDate: start,
              endDate: bufferedEnd(end),
            },
          },
          events: {
            create: {
              actorId: user.id,
              message: input.payment
                ? "Vehicle held while sandbox checkout is completed."
                : "Vehicle allocated. Rental automatically confirmed; payment is due at collection.",
            },
          },
        },
      });
      if (!input.payment) await queueOrderEmail(tx, created.id);
      return created;
    },
    { timeout: 15000 },
  );
  if (!stripe || order.status !== "PENDING")
    return { orderId: order.id, url: `/profile/orders/${order.id}` };
  // Outside the DB transaction: Stripe retry uses the order's stable idempotency key.
  if (order.stripeSessionId) {
    const existing = await stripe.checkout.sessions.retrieve(
      order.stripeSessionId,
    );
    if (existing.url && existing.status === "open")
      return { orderId: order.id, url: existing.url };
    return { orderId: order.id, url: `/profile/orders/${order.id}` };
  }
  const expires = Math.floor(Date.now() / 1000) + 30 * 60;
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      allowed_payment_method_types: ["card"],
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      expires_at: expires,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: order.currency,
            unit_amount: Math.round(Number(order.totalPrice) * 100),
            product_data: {
              name: order.vehicleName || "AutoVerse rental",
              description: "Sandbox demonstration · no real charge",
            },
          },
        },
      ],
      success_url: `${origin}/profile/orders/${order.id}?checkout=complete`,
      cancel_url: `${origin}/profile/orders/${order.id}?checkout=cancelled`,
    },
    { idempotencyKey: `checkout:${order.id}` },
  );
  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripeSessionId: session.id,
      expiresAt: new Date(session.expires_at * 1000),
    },
  });
  return {
    orderId: order.id,
    url: session.url || `/profile/orders/${order.id}`,
  };
}

export async function cancelBooking(orderId: string) {
  const user = await requireUser();
  const found = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id },
  });
  if (!found) throw new Error("Booking not found.");
  const order = await prisma.$transaction(async (tx) => {
    await lockCar(tx, found.carId);
    const fresh = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    if (!["PENDING", "CONFIRMED"].includes(fresh.status))
      throw new Error("This rental cannot be cancelled.");
    // Unconfirmed requests and unpaid checkout holds may always be withdrawn.
    if (fresh.status !== "PENDING" && !canCancel(fresh.startDate))
      throw new Error("Cancellation closes 48 hours before pickup.");
    await tx.vehicleReservation.updateMany({
      where: { orderId },
      data: { active: false },
    });
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        paymentStatus:
          fresh.paymentStatus === "PAID"
            ? "REFUND_PENDING"
            : fresh.paymentStatus,
      },
    });
    await tx.orderEvent.create({
      data: {
        orderId,
        actorId: user.id,
        message: "Customer cancelled the booking.",
      },
    });
    await queueOrderEmail(tx, orderId);
    return updated;
  });
  if (order.stripeSessionId && order.paymentStatus === "UNPAID") {
    try {
      await getStripe().checkout.sessions.expire(order.stripeSessionId);
    } catch {
      /* A late payment is refunded by webhook settlement. */
    }
  }
  try {
    await refundOrder(orderId);
  } catch {
    /* Durable REFUND_PENDING is retried by maintenance. */
  }
}
