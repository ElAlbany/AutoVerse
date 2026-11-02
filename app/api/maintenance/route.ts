import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { expireHolds, lockCar } from "@/lib/inventory";
import { deliverNotifications } from "@/lib/notifications";
import { refundOrder } from "@/lib/payments";

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (
    !expected ||
    Buffer.byteLength(supplied) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(
      new TextEncoder().encode(supplied),
      new TextEncoder().encode(expected)
    )
  )
    return new Response("Unauthorized", { status: 401 });
  const cars = await prisma.order.findMany({
    where: { status: "PENDING", expiresAt: { lte: new Date() } },
    distinct: ["carId"],
    select: { carId: true },
    take: 100,
  });
  for (const { carId } of cars)
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, carId);
      await expireHolds(tx, carId);
    });
  const refunds = await prisma.order.findMany({
    where: { paymentStatus: "REFUND_PENDING" },
    select: { id: true },
    take: 25,
  });
  let refundFailures = 0;
  for (const { id } of refunds) {
    try {
      await refundOrder(id);
    } catch {
      refundFailures++;
    }
  }
  await prisma.rateLimit.deleteMany({
    where: { resetAt: { lt: new Date(Date.now() - 86400000) } },
  });
  return Response.json({
    expiredListings: cars.length,
    notifications: await deliverNotifications(),
    refundFailures,
  });
}
