"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

const navItems = [
  { href: "/profile", label: "Dashboard", icon: "🏠" },
  { href: "/profile/orders", label: "My Orders", icon: "📋" },
  { href: "/profile/account", label: "Account Settings", icon: "⚙️" },
];

export default function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-28">
      <h2 className="text-lg font-bold text-gray-900 mb-1">My Account</h2>
      <p className="text-sm text-gray-500 mb-6">Manage your rentals</p>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              pathname === item.href
                ? "bg-primary-blue text-white shadow-md shadow-blue-200"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <SignOutButton redirectUrl="/">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
            <span>🚪</span>
            Sign Out
          </button>
        </SignOutButton>
      </div>
    </div>
  );
}
