"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");
  return user;
}

/* ─────────────── Existing: Order Status ─────────────── */

export async function updateOrderStatus(orderId: string, status: string) {
  await checkAdmin();

  const validStatuses = [
    "PENDING",
    "CONFIRMED",
    "ACTIVE",
    "COMPLETED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(status)) throw new Error("Invalid status");

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as any },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/profile/orders");
}

/* ─────────────── Helpers ─────────────── */

function generateCarImages(make: string, model: string, year: number) {
  const angles = ["01", "05", "09", "13", "29"];
  return angles.map((angle) => {
    const url = new URL("https://cdn.imagin.studio/getimage");
    url.searchParams.append("customer", "img");
    url.searchParams.append("make", make);
    url.searchParams.append("modelFamily", model.split(" ")[0]);
    url.searchParams.append("zoomType", "fullscreen");
    url.searchParams.append("modelYear", `${year}`);
    url.searchParams.append("angle", angle);
    return url.toString();
  });
}

/* ─────────────── Create Car ─────────────── */

export async function createCar(formData: FormData) {
  await checkAdmin();

  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const pricePerDay = parseFloat(formData.get("pricePerDay") as string);
  const fuel_type = formData.get("fuel_type") as string;
  const transmission = formData.get("transmission") as string;
  const drive = formData.get("drive") as string;
  const city_mpg = parseInt(formData.get("city_mpg") as string);
  const highway_mpg = parseInt(formData.get("highway_mpg") as string);
  const combination_mpg = parseInt(formData.get("combination_mpg") as string);
  const cylinders = parseInt(formData.get("cylinders") as string);
  const displacement = parseFloat(formData.get("displacement") as string);
  const class_type = formData.get("class") as string;
  const description = formData.get("description") as string;
  const available = formData.get("available") === "on";
  const featured = formData.get("featured") === "on";

  if (!make || !model || !year || isNaN(pricePerDay)) {
    throw new Error("Please fill in all required fields correctly");
  }

  const images = generateCarImages(make, model, year);

  await prisma.car.create({
    data: {
      make,
      model,
      year,
      pricePerDay,
      fuel_type,
      transmission,
      drive,
      city_mpg: isNaN(city_mpg) ? 0 : city_mpg,
      highway_mpg: isNaN(highway_mpg) ? 0 : highway_mpg,
      combination_mpg: isNaN(combination_mpg) ? 0 : combination_mpg,
      cylinders: isNaN(cylinders) ? 4 : cylinders,
      displacement: isNaN(displacement) ? 2.0 : displacement,
      class: class_type,
      description: description || null,
      images,
      available,
      featured,
    },
  });

  revalidatePath("/admin/cars");
  revalidatePath("/");
  redirect("/admin/cars");
}

/* ─────────────── Update Car ─────────────── */

export async function updateCar(formData: FormData) {
  await checkAdmin();

  const id = formData.get("id") as string;
  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const year = parseInt(formData.get("year") as string);
  const pricePerDay = parseFloat(formData.get("pricePerDay") as string);
  const fuel_type = formData.get("fuel_type") as string;
  const transmission = formData.get("transmission") as string;
  const drive = formData.get("drive") as string;
  const city_mpg = parseInt(formData.get("city_mpg") as string);
  const highway_mpg = parseInt(formData.get("highway_mpg") as string);
  const combination_mpg = parseInt(formData.get("combination_mpg") as string);
  const cylinders = parseInt(formData.get("cylinders") as string);
  const displacement = parseFloat(formData.get("displacement") as string);
  const class_type = formData.get("class") as string;
  const description = formData.get("description") as string;
  const available = formData.get("available") === "on";
  const featured = formData.get("featured") === "on";
  const regenerateImages = formData.get("regenerateImages") === "on";

  if (!id || !make || !model || !year || isNaN(pricePerDay)) {
    throw new Error("Please fill in all required fields correctly");
  }

  const existingCar = await prisma.car.findUnique({ where: { id } });
  if (!existingCar) throw new Error("Car not found");

  const images =
    regenerateImages ||
    existingCar.make !== make ||
    existingCar.model !== model ||
    existingCar.year !== year
      ? generateCarImages(make, model, year)
      : existingCar.images;

  await prisma.car.update({
    where: { id },
    data: {
      make,
      model,
      year,
      pricePerDay,
      fuel_type,
      transmission,
      drive,
      city_mpg: isNaN(city_mpg) ? 0 : city_mpg,
      highway_mpg: isNaN(highway_mpg) ? 0 : highway_mpg,
      combination_mpg: isNaN(combination_mpg) ? 0 : combination_mpg,
      cylinders: isNaN(cylinders) ? 4 : cylinders,
      displacement: isNaN(displacement) ? 2.0 : displacement,
      class: class_type,
      description: description || null,
      images,
      available,
      featured,
    },
  });

  revalidatePath("/admin/cars");
  revalidatePath("/");
  revalidatePath(`/car-details/${id}`);
  redirect("/admin/cars");
}

/* ─────────────── Delete Car ─────────────── */

export async function deleteCar(id: string) {
  await checkAdmin();
  if (!id) throw new Error("Car ID is required");

  await prisma.car.delete({ where: { id } });

  revalidatePath("/admin/cars");
  revalidatePath("/");
}

/* ─────────────── Toggle Available / Featured ─────────────── */

export async function toggleCarStatus(
  id: string,
  field: "available" | "featured",
  value: boolean,
) {
  await checkAdmin();
  if (!id || !field) throw new Error("Invalid request");

  await prisma.car.update({
    where: { id },
    data: { [field]: value },
  });

  revalidatePath("/admin/cars");
  revalidatePath("/");
  revalidatePath(`/car-details/${id}`);
}
