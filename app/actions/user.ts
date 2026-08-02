"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function syncUser() {
  const { userId } = await auth();

  if (!userId) return null;

  // Check if user exists in our DB
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (existingUser) return existingUser;

  // Get user details from Clerk (we'll fetch from Clerk's API)
  // For now, create with basic info
  const newUser = await prisma.user.create({
    data: {
      clerkId: userId,
      email: "", // We'll fill this next
      firstName: "",
      lastName: "",
    },
  });

  return newUser;
}
