import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CarTable from "@/components/admin/CarTable";

export default async function AdminCarsPage() {
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serializedCars = cars.map((c) => ({
    ...c,
    pricePerDay: Number(c.pricePerDay),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cars</h1>
          <p className="text-gray-500 mt-1">Manage your car fleet</p>
        </div>
        <Link
          href="/admin/cars/new"
          className="bg-primary-blue text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <span>+</span> Add New Car
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <CarTable cars={serializedCars} />
      </div>
    </div>
  );
}
