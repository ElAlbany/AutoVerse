import "server-only";
import Stripe from "stripe";
import { prisma } from "./prisma";
import { lockCar } from "./inventory";
import { queueOrderEmail } from "./notifications";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key)
    throw new Error(
      "Demo payments are not configured. Please request a booking instead.",
    );
  if (!key.startsWith("sk_test_"))
    throw new Error("AutoVerse demo accepts Stripe sandbox keys only.");
  return new Stripe(key, { maxNetworkRetries: 2, timeout: 15000 });
}

export function appUrl() {
  const value = process.env.APP_URL || "http://localhost:3000";
  const url = new URL(value);
  if (
    process.env.NODE_ENV === "production" &&
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new Error("APP_URL must use HTTPS in production.");
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("APP_URL must use HTTP or HTTPS.");
  return url.origin;
}

export async function refundOrder(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });
  if (order.paymentStatus !== "REFUND_PENDING" || !order.stripePaymentIntentId)
    return;
  const refund = await getStripe().refunds.create(
    { payment_intent: order.stripePaymentIntentId },
    { idempotencyKey: `refund:${order.id}` },
  );
  if (refund.status === "succeeded")
    await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: "REFUND_PENDING" },
      data: { paymentStatus: "REFUNDED" },
    });
}

export async function settleCheckout(
  session: Stripe.Checkout.Session,
  eventId: string,
) {
  if (session.livemode) throw new Error("Live payments are disabled.");
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (!order) throw new Error("Checkout order not found; retry delivery.");
  await prisma.$transaction(async (tx) => {
    await lockCar(tx, order.carId);
    if (await tx.webhookEvent.findUnique({ where: { id: eventId } })) return;
    const fresh = await tx.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { reservation: true },
    });
    if (
      session.amount_total !== Math.round(Number(fresh.totalPrice) * 100) ||
      session.currency !== fresh.currency ||
      session.client_reference_id !== fresh.id
    )
      throw new Error("Payment does not match the rental quote.");
    if (session.payment_status === "paid" && fresh.paymentStatus === "UNPAID") {
      const valid =
        fresh.status === "PENDING" &&
        fresh.reservation?.active &&
        fresh.expiresAt &&
        fresh.expiresAt > new Date();
      await tx.order.update({
        where: { id: fresh.id },
        data: {
          paymentStatus: valid ? "PAID" : "REFUND_PENDING",
          status: valid ? "CONFIRMED" : "CANCELLED",
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
        },
      });
      if (!valid)
        await tx.vehicleReservation.updateMany({
          where: { orderId: fresh.id },
          data: { active: false },
        });
      await tx.orderEvent.create({
        data: {
          orderId: fresh.id,
          message: valid
            ? "Sandbox payment verified. Rental confirmed."
            : "Payment arrived after the hold ended. Refund queued.",
        },
      });
      await queueOrderEmail(tx, fresh.id);
    } else if (
      session.status === "expired" &&
      fresh.status === "PENDING" &&
      fresh.paymentStatus === "UNPAID"
    ) {
      await tx.order.update({
        where: { id: fresh.id },
        data: { status: "CANCELLED" },
      });
      await tx.vehicleReservation.updateMany({
        where: { orderId: fresh.id },
        data: { active: false },
      });
    }
    await tx.webhookEvent.create({ data: { id: eventId } });
  });
  await refundOrder(order.id);
}
