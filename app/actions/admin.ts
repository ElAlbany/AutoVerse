"use server";
import { validCarImageUrl } from "@/lib/car-media";
import { validateVehicleUses } from "@/lib/vehicle-use";
import { randomUUID } from "node:crypto";
import { RentalError, runAction } from "@/lib/action-result";
import { transitionRental } from "@/lib/rental-lifecycle";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { lockCar } from "@/lib/inventory";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateOrderStatus(orderId: string, status: string) {
  return runAction(async () => {
    const admin = await requireAdmin();
    await transitionRental(orderId, status, admin.id);
    revalidatePath("/admin/orders");
    revalidatePath("/admin/fleet");
    revalidatePath("/profile/orders");
    revalidatePath(`/profile/orders/${orderId}`);
  });
}

function carData(form: FormData) {
  const text = (key: string, max = 200) =>
    String(form.get(key) || "")
      .trim()
      .slice(0, max);
  const num = (key: string, fallback = 0) => {
    const raw = text(key);
    return raw ? Number(raw) : fallback;
  };
  const make = text("make"),
    model = text("model"),
    year = num("year"),
    pricePerDay = num("pricePerDay");
  if (
    !make ||
    !model ||
    !Number.isInteger(year) ||
    year < 1990 ||
    year > new Date().getFullYear() + 2 ||
    !Number.isFinite(pricePerDay) ||
    pricePerDay <= 0 ||
    pricePerDay > 100000
  )
    throw new RentalError(
      "Provide a make, model, valid year and positive daily rate.",
    );
  const seats = num("seats"),
    luggage = text("luggage") ? num("luggage") : null;
  if (!Number.isInteger(seats) || seats < 1 || seats > 20)
    throw new RentalError("Seats must be 1–20.");
  if (
    luggage !== null &&
    (!Number.isInteger(luggage) || luggage < 0 || luggage > 20)
  )
    throw new RentalError("Luggage capacity must be 0–20.");
  const images = text("images", 4000)
    .split(/\r?\n/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (images.length > 12 || images.some((src) => !validCarImageUrl(src)))
    throw new RentalError("Use up to 12 uploaded photos or HTTPS image URLs.");
  const imageSource = text("imageSource");
  if (!["API", "UPLOADED"].includes(imageSource))
    throw new RentalError("Choose API illustrations or real photographs.");
  if (
    imageSource === "UPLOADED" &&
    (!images.length ||
      images.some(
        (src) => src.includes("imagin.studio") || src.includes("placeholder"),
      ))
  )
    throw new RentalError(
      "Add at least one real vehicle photo, or select model illustrations.",
    );
  const metrics = {
    city_mpg: num("city_mpg"),
    highway_mpg: num("highway_mpg"),
    combination_mpg: num("combination_mpg"),
    cylinders: num("cylinders"),
    displacement: num("displacement"),
  };
  if (
    Object.entries(metrics).some(([key, v]) => !Number.isFinite(v) || v < 0 || v > 1000 || (key !== "displacement" && !Number.isInteger(v)))
  )
    throw new RentalError(
      "Vehicle specifications must be valid non-negative numbers.",
    );
  const transmission = text("transmission");
  if (!["a", "m"].includes(transmission))
    throw new RentalError("Choose a valid transmission.");
  const groundClearanceMm = text("groundClearanceMm")
    ? num("groundClearanceMm")
    : null;
  if (
    groundClearanceMm !== null &&
    (!Number.isInteger(groundClearanceMm) ||
      groundClearanceMm < 50 ||
      groundClearanceMm > 600)
  )
    throw new RentalError(
      "Ground clearance must be 50–600 mm, or blank if unverified.",
    );
  const capabilities = {
    groundClearanceMm,
    lowRange4x4: form.get("lowRange4x4") === "on",
    suitableTyres: form.get("suitableTyres") === "on",
    roughRoadApproved: form.get("roughRoadApproved") === "on",
  };
  const usageTags = validateVehicleUses(
    form.getAll("usageTags").map(String),
    capabilities,
  );
  return {
    ...capabilities,
    usageTags,
    make,
    model,
    year,
    pricePerDay,
    seats,
    luggage,
    images,
    imageSource,
    features: text("features", 1500)
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 30),
    location: text("location") || "Main collection point",
    fuel_type: text("fuel_type"),
    transmission,
    drive: text("drive"),
    class: text("class"),
    description: text("description", 5000) || null,
    available: form.get("available") === "on",
    featured: form.get("featured") === "on",
    ...metrics,
  };
}
export async function createCar(form: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const data = carData(form);
    const branchId = String(form.get("branchId") || "");
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Branch" WHERE id = ${branchId} FOR SHARE`;
      const branch = await tx.branch.findFirst({
        where: { id: branchId, active: true },
      });
      if (!branch) throw new RentalError("Choose an active collection branch.");
      await tx.car.create({
        data: {
          ...data,
          location: branch.name,
          units: { create: { code: `AV-${randomUUID().slice(0, 8)}`, branchId } },
        },
      });
    });
    revalidatePath("/");
    revalidatePath("/admin/cars");
  });
  if (!result.ok) return result;
  redirect("/admin/cars");
}
export async function updateCar(form: FormData) {
  const result = await runAction(async () => {
    await requireAdmin();
    const id = String(form.get("id"));
    const data = carData(form);
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, id);
      if (
        data.available &&
        (await tx.order.count({
          where: {
            carId: id,
            inventoryConflict: true,
            status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          },
        }))
      )
        throw new RentalError(
          "Resolve legacy assignments in Fleet before enabling this listing.",
        );
      await tx.car.update({ where: { id }, data });
    });
    revalidatePath("/");
    revalidatePath(`/car-details/${id}`);
    revalidatePath("/admin/cars");
  });
  if (!result.ok) return result;
  redirect("/admin/cars");
}
export async function deleteCar(id: string) {
  return runAction(async () => {
    await requireAdmin();
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, id);
      await tx.car.update({
        where: { id },
        data: { archived: true, available: false },
      });
    });
    revalidatePath("/");
    revalidatePath("/admin/cars");
  });
}
export async function toggleCarStatus(
  id: string,
  field: "available" | "featured",
  value: boolean,
) {
  return runAction(async () => {
    await requireAdmin();
    if (!["available", "featured"].includes(field) || typeof value !== "boolean")
      throw new RentalError("Invalid update.");
    await prisma.$transaction(async (tx) => {
      await lockCar(tx, id);
      if (
        field === "available" &&
        value &&
        (await tx.order.count({
          where: {
            carId: id,
            inventoryConflict: true,
            status: { in: ["PENDING", "CONFIRMED", "ACTIVE"] },
          },
        }))
      )
        throw new RentalError("Resolve vehicle assignments in Fleet first.");
      await tx.car.update({ where: { id }, data: { [field]: value } });
    });
    revalidatePath("/");
    revalidatePath("/admin/cars");
    revalidatePath(`/car-details/${id}`);
  });
}
export async function updateUserRole(userId: string, role: string) {
  return runAction(async () => {
    const admin = await requireAdmin();
    if (!["USER", "ADMIN"].includes(role)) throw new RentalError("Invalid role.");
    if (admin.id === userId && role !== "ADMIN")
      throw new RentalError("You cannot remove your own admin access.");
    await prisma.user.update({ where: { id: userId }, data: { role } });
    revalidatePath("/admin/users");
  });
}
export async function deleteUser(userId: string) {
  return runAction(async () => {
    const admin = await requireAdmin();
    if (admin.id === userId)
      throw new RentalError("You cannot delete your own account.");
    if (await prisma.order.count({ where: { userId } }))
      throw new RentalError(
        "This account has rental history. Use your company's retention and anonymization process instead.",
      );
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin/users");
  });
}
