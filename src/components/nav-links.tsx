"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/decks", label: "Decks" },
  { href: "/courses", label: "Courses" },
  { href: "/review", label: "Review" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-teal-700 text-white dark:bg-teal-600"
                : "text-slate-700 hover:bg-teal-50 hover:text-teal-900 dark:text-slate-200 dark:hover:bg-teal-950/60 dark:hover:text-teal-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

