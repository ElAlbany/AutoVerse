"use client";
import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BranchSelector({
  branches,
  branchId,
  path = "/",
}: {
  branches: { id: string; name: string; city: string }[];
  branchId: string;
  path?: string;
}) {
  const router = useRouter(),
    params = useSearchParams();
  const [pending, start] = useTransition();
  return (
    <label className="av-field">
      Collection branch
      <select
        value={branchId}
        disabled={pending || !branches.length}
        onChange={(event) => {
          const query = new URLSearchParams(params.toString());
          query.set("branchId", event.target.value);
          query.delete("page");
          start(() =>
            router.push(`${path}?${query}${path === "/" ? "#discover" : ""}`, {
              scroll: false,
            }),
          );
        }}
      >
        {!branches.length && <option value="">No branches available</option>}
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name} · {branch.city}
          </option>
        ))}
      </select>
      {pending && <small role="status">Loading branch cars…</small>}
    </label>
  );
}
