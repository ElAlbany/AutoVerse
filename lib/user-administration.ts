import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { RentalError } from "./action-result";

async function lockAdministrators(tx: Prisma.TransactionClient, actorId: string) {
  // Use a consistent lock order for role changes and profile deletion. Recheck
  // the actor after waiting: another administrator may have revoked access.
  await tx.$queryRaw`SELECT id FROM "User" WHERE role = 'ADMIN' ORDER BY id FOR UPDATE`;
  if (!(await tx.user.findFirst({ where: { id: actorId, role: "ADMIN" } })))
    throw new RentalError("Administrator access required.");
}

export async function changeUserRole(userId: string, role: string, actorId: string) {
  if (!["USER", "ADMIN"].includes(role)) throw new RentalError("Invalid role.");
  await prisma.$transaction(async (tx) => {
    await lockAdministrators(tx, actorId);
    if (actorId === userId && role !== "ADMIN")
      throw new RentalError("You cannot remove your own admin access.");
    await tx.user.update({ where: { id: userId }, data: { role } });
  });
}

export async function deleteUserProfile(userId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    await lockAdministrators(tx, actorId);
    if (actorId === userId)
      throw new RentalError("You cannot delete your own account.");
    if (await tx.order.count({ where: { userId } }))
      throw new RentalError("This account has rental history. Use your company's retention and anonymization process instead.");
    await tx.user.delete({ where: { id: userId } });
  });
}
