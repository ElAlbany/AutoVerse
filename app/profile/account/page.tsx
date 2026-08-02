import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your email, password, and connected accounts.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border-0 w-full",
              navbar: "border-r border-gray-100",
              navbarButton: "text-sm font-medium",
            },
            variables: {
              colorPrimary: "#2563eb",
              colorBackground: "#ffffff",
              borderRadius: "12px",
            },
          }}
        />
      </div>
    </div>
  );
}
