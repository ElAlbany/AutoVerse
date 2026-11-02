import "server-only";
import { prisma } from "./prisma";
import { RentalError } from "./action-result";
export async function writeReview(
  userId: string,
  orderId: string,
  rating: number,
  comment: string,
) {
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    typeof comment !== "string" ||
    comment.length > 2000
  )
    throw new RentalError(
      "Use a rating from 1 to 5 and a review under 2,000 characters.",
    );
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "COMPLETED" },
    include: { review: true },
  });
  if (!order)
    throw new RentalError("Only your completed rentals can be reviewed.");
  if (
    order.review &&
    Date.now() - order.review.createdAt.getTime() > 14 * 86400000
  )
    throw new RentalError(
      "Reviews can be edited for 14 days after submission.",
    );
  await prisma.review.upsert({
    where: { orderId },
    create: {
      orderId,
      userId,
      carId: order.carId,
      rating,
      comment: comment.trim(),
    },
    update: { rating, comment: comment.trim() },
  });

  return order.carId;
}
