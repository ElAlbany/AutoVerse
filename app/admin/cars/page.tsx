import BranchSelector from "@/components/BranchSelector";
import { selectedBranch } from "@/lib/stock-policy";
import { currentFreeUnitWhere } from "@/lib/inventory";
import type { Prisma } from "@prisma/client";
import AdminPagination from "@/components/admin/AdminPagination";
import { pageWindow, searchValue } from "@/lib/admin-query";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CarTable from "@/components/admin/CarTable";
import SearchCars from "@/components/admin/SearchCars";

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; branchId?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const search = searchValue(params.search).toLowerCase();

  let where: Prisma.CarWhereInput = { archived: false };
  if (search) {
    const words = search.split(/\s+/).filter(Boolean);
    where = {
      AND: words.map((word) => {
        const orConditions: Prisma.CarWhereInput[] = [
          { make: { contains: word, mode: "insensitive" } },
          { model: { contains: word, mode: "insensitive" } },
          { class: { contains: word, mode: "insensitive" } },
        ];
        const yearNum = parseInt(word);
        if (!isNaN(yearNum)) {
          orConditions.push({ year: { equals: yearNum } });
        }
        return { OR: orConditions };
      }),
    };
  }

  const branches = await prisma.branch.findMany({ select: { id: true, name: true, city: true }, orderBy: { name: "asc" } });
  const branch = selectedBranch(branches, searchValue(params.branchId));
  const branchId = branch?.id || "";
  where.branchId = branchId || "__no_branch__";
  const matched = await prisma.car.count({ where: { ...where, archived: false } });
  const pagination = pageWindow(params.page, matched);

  const cars = await prisma.car.findMany({
    where: { ...where, archived: false },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.size,
    include: { branch: { select: { name: true } }, _count: { select: { units: { where: currentFreeUnitWhere(branchId) } } } },
  });

  const serializedCars = cars.map((c) => ({
    ...c,
    pricePerDay: Number(c.pricePerDay),
    branchName: c.branch.name,
    availableNow: c.available ? c._count.units : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            Cars
          </h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">
            Manage the models and quantities at {branch?.name || "this branch"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <BranchSelector branches={branches} branchId={branchId} path="/admin/cars" />
          <SearchCars initialSearch={search || ""} branchId={branchId} />
          <Link
            href={`/admin/cars/new?branchId=${branchId}`}
            className="w-full sm:w-auto justify-center bg-primary-blue text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 dark:shadow-lg dark:shadow-primary-blue/20 flex-shrink-0"
          >
            <span>+</span> Add New Car
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-colors duration-500">
        <CarTable cars={serializedCars} />
      </div>
      <AdminPagination path="/admin/cars" search={search} filters={{ branchId }} pagination={pagination} />
    </div>
  );
}
