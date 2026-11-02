import { requireAdmin } from "@/lib/auth";
import { createCar } from "@/app/actions/admin";
import CarForm from "@/components/admin/CarForm";

import { publicBranches } from "@/lib/branches";

export default async function NewCarPage({ searchParams }: { searchParams: Promise<{ branchId?: string }> }) {
  await requireAdmin();
  const branches = await publicBranches();
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
          Add New Car
        </h1>
        <p className="text-gray-500 dark:text-dark-muted mt-1">
          Fill in the details to add a car to the fleet
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-500">
        <CarForm action={createCar} mode="create" branches={branches} initialBranchId={typeof params.branchId === "string" ? params.branchId : ""} />
      </div>
    </div>
  );
}
