import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileSidebar from "@/components/ProfileSidebar";
import { syncOrderStatuses } from "@/lib/order-sync";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (!user) redirect("/sign-in");

  await syncOrderStatuses();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-24 lg:pt-28 pb-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <ProfileSidebar isAdmin={user.role === "ADMIN"} />
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
