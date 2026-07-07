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
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-white hover:text-slate-950"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
