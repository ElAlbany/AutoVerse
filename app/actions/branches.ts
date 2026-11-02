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
    if (id) await prisma.branch.update({ where: { id }, data });
    else await prisma.branch.create({ data });
    revalidatePath("/admin/branches");
    revalidatePath("/admin/fleet");
    revalidatePath("/");
  });
}
