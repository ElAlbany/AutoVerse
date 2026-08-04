import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClerkUserProfile from "@/components/ClerkUserProfile";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Account Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your email, password, and connected accounts.
        </p>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden transition-all duration-500 hover:shadow-lg">
        <ClerkUserProfile />
      </div>
    </div>
  );
}
