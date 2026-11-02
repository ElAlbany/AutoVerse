"use server";
import { getOrCreateUser } from "@/lib/sync-user";
export async function syncUser() {
  return getOrCreateUser();
}
