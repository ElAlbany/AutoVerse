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
    <main className="min-h-screen bg-gray-50 dark:bg-dark-bg pt-24 sm:pt-28 pb-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Mobile / tablet nav — compact horizontal pill bar, replaces the sidebar below lg */}
        <div className="lg:hidden mb-6">
          <div className="bg-white dark:bg-dark-card rounded-2xl p-2 shadow-sm border border-gray-100 dark:border-dark-border transition-colors duration-500">
            <AdminNav variant="mobile" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Desktop sidebar — hidden below lg, mobile nav above takes over */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
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
