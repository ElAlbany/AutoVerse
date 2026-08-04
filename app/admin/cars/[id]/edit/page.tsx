import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCar } from "@/app/actions/admin";
import CarForm from "@/components/admin/CarForm";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const car = await prisma.car.findUnique({
    where: { id },
  });

  if (!car) notFound();

  const serializedCar = {
    ...car,
    pricePerDay: Number(car.pricePerDay),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
          Edit Car
        </h1>
        <p className="text-gray-500 dark:text-dark-muted mt-1">
          Update car details
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-500">
        <CarForm action={updateCar} initialData={serializedCar} mode="edit" />
      </div>
    </div>
  );
}
