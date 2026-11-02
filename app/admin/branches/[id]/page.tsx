import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { loadBranchDetails } from "@/lib/branch-data";
import BranchDetailsView from "@/components/admin/BranchDetailsView";

export default async function BranchDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const data = await loadBranchDetails((await params).id, await searchParams);
  if (!data) notFound();
  return <BranchDetailsView data={data} />;
}
