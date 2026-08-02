import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getOrCreateUser() {
  const { userId } = await auth();

  if (!userId) return null;

  // Check if user exists in our database
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (user) return user;

  // Get full user data from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) return null;

  // Create user in our database
  user = await prisma.user.create({
    data: {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
    },
  });

  return user;
}
