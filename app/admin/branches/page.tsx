import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import BranchesOverview from "@/components/admin/BranchesOverview";

export default async function BranchesPage() {
  await requireAdmin();
  const branches = await prisma.branch.findMany({
    orderBy: [{ city: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      city: true,
      active: true,
      address: true,
      _count: {
        select: {
          cars: { where: { archived: false } },
          units: { where: { enabled: true, car: { archived: false } } },
        },
      },
    },
  });
  return <BranchesOverview branches={branches} />;
}
