"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

export default function ProfileSidebar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const navItems = [
    ...(isAdmin
      ? [
          {
            href: "/admin",
            label: "Admin Dashboard",
            icon: "🛡️",
            badge: "ADMIN",
          },
        ]
      : []),
    { href: "/profile", label: "Dashboard", icon: "🏠" },
    { href: "/profile/orders", label: "My Orders", icon: "📋" },
    { href: "/profile/account", label: "Account Settings", icon: "⚙️" },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-28">
      <h2 className="text-lg font-bold text-gray-900 mb-1">My Account</h2>
      <p className="text-sm text-gray-500 mb-6">Manage your rentals</p>

      <nav className="flex flex-col gap-2 mb-6">
        {navItems.map((item) => {
          const isActive =
            item.href === "/profile" || item.href === "/admin"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary-blue text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {"badge" in item && item.badge && (
                <span className="ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-gray-100">
        <SignOutButton>
          <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full">
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
