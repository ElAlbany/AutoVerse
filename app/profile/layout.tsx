import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileSidebar from "@/components/ProfileSidebar";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <main className="min-h-screen bg-gray-50 pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <ProfileSidebar />
          </aside>
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
