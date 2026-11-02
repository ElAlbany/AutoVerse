import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { saveBranch } from "@/app/actions/branches";
import ActionForm from "./ActionForm";
import BranchFields from "./BranchFields";
export type BranchSummary = {
  id: string;
  name: string;
  city: string;
  active: boolean;
  address: string | null;
  _count: { cars: number; units: number };
};
export default function BranchesOverview({
  branches,
}: {
  branches: BranchSummary[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="av-eyebrow">Your locations</p>
        <h1 className="text-3xl">Branches & stock</h1>
      </div>
      <p className="av-muted">
        Each branch owns its catalogue and fleet quantities. Open a branch to
        manage its cars, check availability and see rental activity.
      </p>
      <div className="av-branch-grid">
        {branches.map((branch) => (
          <Link
            className="av-panel av-branch-card"
            href={`/admin/branches/${branch.id}`}
            key={branch.id}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="av-muted flex items-center gap-2">
                <MapPin size={16} />
                {branch.city}
              </span>
              <span className="av-branch-status">
                {branch.active ? "Open" : "Closed"}
              </span>
            </div>
            <h2>{branch.name}</h2>
            <p className="av-muted">
              {branch.address || "Collection address not set"}
            </p>
            <div className="av-branch-card-footer">
              <span>
                {branch._count.cars} models · {branch._count.units} in-service
                cars
              </span>
              <ArrowUpRight size={20} />
            </div>
          </Link>
        ))}
      </div>
      {!branches.length && (
        <p className="av-panel av-muted">
          Create your first branch to start its catalogue.
        </p>
      )}
      <details className="av-panel">
        <summary className="cursor-pointer">Create a branch</summary>
        <div className="mt-5">
          <ActionForm action={saveBranch} label="Create branch">
            <BranchFields />
          </ActionForm>
        </div>
      </details>
    </div>
  );
}
