import { requireAdmin } from "@/lib/auth";
import { getFleetWorkspaceData } from "@/lib/fleet-data";
import FleetWorkspace from "@/components/admin/FleetWorkspace";

export default async function FleetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const data = await getFleetWorkspaceData(await searchParams);
  return <FleetWorkspace data={data} />;
}
