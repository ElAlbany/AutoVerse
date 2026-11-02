"use server";
import { RentalError, runAction } from "@/lib/action-result";
import { writeReview } from "@/lib/reviews";
import { prisma } from "@/lib/prisma";
import { requireUser, requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";

export async function saveReview(
  orderId: string,
  rating: number,
  comment: string,
) {
  return runAction(async () => {
    const user = await requireUser();
    await rateLimit(`review:${user.id}`, 10);
    const carId = await writeReview(user.id, orderId, rating, comment);
    revalidatePath(`/car-details/${carId}`);
    revalidatePath(`/profile/orders/${orderId}`);
    revalidatePath("/");
  });
}

export async function reportReview(id: string) {
  return runAction(async () => {
    const user = await requireUser();
    await rateLimit(`review-report:${user.id}`, 5);
    await prisma.review.update({ where: { id }, data: { reported: true } });
  });
}

export async function moderateReview(
  id: string,
  hidden: boolean,
  reason: string,
) {
  return runAction(async () => {
    await requireAdmin();
    if (typeof hidden !== "boolean" || typeof reason !== "string" || reason.length > 500)
      throw new RentalError("Provide a valid moderation reason under 500 characters.");
    if (hidden && reason.trim().length < 10)
      throw new RentalError(
        "Provide a specific moderation reason of at least 10 characters.",
      );
    const review = await prisma.review.update({
      where: { id },
      data: { hidden, moderationReason: reason.trim(), reported: false },
    });
    revalidatePath(`/car-details/${review.carId}`);
    revalidatePath("/admin/reviews");
    revalidatePath("/");
  });
}
