import { prisma } from "./prisma";

export async function syncOrderStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // CONFIRMED → ACTIVE when start date is today or earlier
  await prisma.order.updateMany({
    where: {
      status: "CONFIRMED",
      startDate: { lt: tomorrow },
    },
    data: { status: "ACTIVE" },
  });

  // ACTIVE → COMPLETED when end date was yesterday or earlier
  await prisma.order.updateMany({
    where: {
      status: "ACTIVE",
      endDate: { lt: today },
    },
    data: { status: "COMPLETED" },
  });
}
