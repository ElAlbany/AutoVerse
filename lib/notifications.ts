import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { sendOrderStatusEmail } from "./email";

export async function queueOrderEmail(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { user: true, car: true },
  });
  await tx.notification.upsert({
    where: { key: `${order.id}:${order.status}` },
    update: {},
    create: {
      key: `${order.id}:${order.status}`,
      payload: {
        to: order.user.email,
        subject: `AutoVerse · Rental ${order.status.toLowerCase()}`,
        orderId: order.id,
        carName: order.vehicleName || `${order.car.make} ${order.car.model}`,
        status: order.status,
        startDate: order.startDate.toISOString(),
        endDate: order.endDate.toISOString(),
        totalPrice: Number(order.totalPrice),
      },
    },
  });
}

export async function deliverNotifications() {
  if (!process.env.RESEND_API_KEY) return { sent: 0, configured: false };
  const jobs = await prisma.notification.findMany({
    where: { sentAt: null, nextAttemptAt: { lte: new Date() } },
    take: 25,
    orderBy: { createdAt: "asc" },
  });
  let sent = 0;
  for (const job of jobs) {
    // Claim each attempt atomically; another worker cannot send it concurrently.
    const claimed = await prisma.notification.updateMany({
      where: { id: job.id, sentAt: null, nextAttemptAt: job.nextAttemptAt },
      data: {
        attempts: { increment: 1 },
        nextAttemptAt: new Date(Date.now() + 15 * 60000),
      },
    });
    if (!claimed.count) continue;
    try {
      await sendOrderStatusEmail(
        job.payload as Parameters<typeof sendOrderStatusEmail>[0],
        job.key
      );
      await prisma.notification.update({
        where: { id: job.id },
        data: { sentAt: new Date() },
      });
      sent++;
    } catch {
      /* Keep queued; a later maintenance run retries the delivery. */
    }
  }
  return { sent, configured: true };
}
