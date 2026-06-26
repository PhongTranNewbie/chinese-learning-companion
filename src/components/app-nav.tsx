"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/vocabulary", label: "Vocabulary" },
  { href: "/review", label: "Review" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="min-w-0">
          <p className="text-base font-semibold text-slate-950">
            Chinese Learning Companion
          </p>
          <p className="text-sm text-slate-500">Vocabulary and review</p>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

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
          <Link
            href="/vocabulary/new"
            className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
          >
            Add word
          </Link>
        </nav>
      </div>
    </header>
  );
}
