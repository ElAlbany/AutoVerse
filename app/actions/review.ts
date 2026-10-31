"use server";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export async function saveReview(
  orderId: string,
  rating: number,
  comment: string
) {
  const user = await requireUser();
  await rateLimit(`review:${user.id}`, 10);
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    comment.length > 2000
  )
    throw new Error(
      "Use a rating from 1 to 5 and a review under 2,000 characters."
    );
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: user.id, status: "COMPLETED" },
    include: { review: true },
  });
  if (!order) throw new Error("Only your completed rentals can be reviewed.");
  if (
    order.review &&
    Date.now() - order.review.createdAt.getTime() > 14 * 86400000
  )
    throw new Error("Reviews can be edited for 14 days after submission.");
  await prisma.review.upsert({
    where: { orderId },
    create: {
      orderId,
      userId: user.id,
      carId: order.carId,
      rating,
      comment: comment.trim(),
    },
    update: { rating, comment: comment.trim() },
  });
  revalidatePath(`/car-details/${order.carId}`);
  revalidatePath(`/profile/orders/${orderId}`);
  revalidatePath("/");
}

export async function reportReview(id: string) {
  const user = await requireUser();
  await rateLimit(`review-report:${user.id}`, 5);
  await prisma.review.update({ where: { id }, data: { reported: true } });
}

export async function moderateReview(
  id: string,
  hidden: boolean,
  reason: string
) {
  await requireAdmin();
  if (hidden && reason.trim().length < 10)
    throw new Error(
      "Provide a specific moderation reason of at least 10 characters."
    );
  const review = await prisma.review.update({
    where: { id },
    data: { hidden, moderationReason: reason.trim(), reported: false },
  });
  revalidatePath(`/car-details/${review.carId}`);
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}
