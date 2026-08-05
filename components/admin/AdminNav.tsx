"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📋" },
  { href: "/admin/cars", label: "Cars", icon: "🚗" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/profile", label: "My Profile", icon: "👤" },
];

export default function AdminNav({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" || href === "/profile"
      ? pathname === href
      : pathname.startsWith(href);

  if (variant === "mobile") {
    return (
      <nav
        className="flex items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Admin sections"
      >
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
                active
                  ? "bg-primary-blue text-white shadow-sm dark:shadow-lg dark:shadow-primary-blue/20"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-white/10"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-primary-blue text-white shadow-sm dark:shadow-lg dark:shadow-primary-blue/20"
                : "text-gray-600 dark:text-dark-muted hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-dark-text"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
            {active && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
