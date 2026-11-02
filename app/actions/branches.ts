"use server";
import { RentalError, runAction } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveBranch(form: FormData) {
  return runAction(async () => {
    await requireAdmin();
    const id = String(form.get("id") || "");
    const name = String(form.get("name") || "").trim();
    const city = String(form.get("city") || "").trim();
    const address = String(form.get("address") || "").trim();
    if (
      !name ||
      !city ||
      name.length > 100 ||
      city.length > 100 ||
      address.length > 300
    )
      throw new RentalError(
        "Provide a branch name, city and a valid collection address.",
      );
    const data = {
      name,
      city,
      address: address || null,
      active: form.get("active") === "on",
    };
    // UPDATE takes an exclusive row lock; allocation takes a shared branch lock.
    if (id) await prisma.$transaction(async (tx) => {
      // Match booking/stock lock order: listings first, then their branch.
      await tx.$queryRaw`SELECT id FROM "Car" WHERE "branchId" = ${id} ORDER BY id FOR UPDATE`;
      await tx.branch.update({ where: { id }, data });
      await tx.car.updateMany({ where: { branchId: id }, data: { location: name } });
    });
    else await prisma.branch.create({ data });
    if (id) revalidatePath(`/admin/branches/${id}`);
    revalidatePath("/admin/branches");
    revalidatePath("/admin/cars");
    revalidatePath("/admin/fleet");
    revalidatePath("/");
  });
}
