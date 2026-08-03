"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📋" },
  { href: "/admin/cars", label: "Cars", icon: "🚗" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        // Check if current pathname starts with the item's href
        // For /admin, exact match only to avoid matching all /admin/* routes
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
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
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
