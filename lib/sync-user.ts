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

  const email = clerkUser.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId
  )?.emailAddress;
  if (!email)
    throw new Error("A primary email address is required to book a rental.");

  // Create user in our database
  user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email,
      firstName: clerkUser.firstName || "",
      lastName: clerkUser.lastName || "",
    },
  });

  return user;
}
