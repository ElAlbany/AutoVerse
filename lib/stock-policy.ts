import { RentalError } from "./action-result";

export function stockQuantity(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^\d{1,4}$/.test(value) ||
    Number(value) > 1000
  )
    throw new RentalError(
      "Fleet quantity must be a whole number from 0 to 1,000.",
    );
  return Number(value);
}

export function selectedBranch<T extends { id: string }>(
  branches: T[],
  requested?: string,
) {
  return (
    branches.find((branch) => branch.id === requested) ||
    branches.find((branch) => branch.id === "branch-main") ||
    branches[0]
  );
}
