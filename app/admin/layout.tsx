import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminNav from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user || user.role !== "ADMIN") redirect("/");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-28 pb-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-dark-card rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-border sticky top-28 transition-colors duration-500">
              <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-1">
                Admin
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-muted mb-6">
                Manage the platform
              </p>
              <AdminNav />
            </div>
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
