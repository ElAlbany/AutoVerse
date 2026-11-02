import { RentalError } from "./action-result";
import "server-only";
import { getOrCreateUser } from "./sync-user";

export async function requireUser() {
  const user = await getOrCreateUser();
  if (!user) throw new RentalError("Please sign in to continue.");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN")
    throw new RentalError("Administrator access required.");
  return user;
}
