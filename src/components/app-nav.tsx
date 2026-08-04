import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { signOutCurrentUser } from "@/lib/auth-actions";
import {
  appearanceThemeCookieName,
  getAppearanceThemeLabel,
  parseAppearanceTheme,
  type AppearanceTheme,
} from "@/lib/appearance";
import { updateAppearanceTheme } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { NavLinks } from "@/components/nav-links";

export async function AppNav() {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const userLabel = session?.user?.name ?? session?.user?.email ?? "Member";
  const cookieTheme = parseAppearanceTheme(
    cookieStore.get(appearanceThemeCookieName)?.value,
  );
  const memberTheme = session?.user?.id
    ? await getMemberAppearanceTheme(session.user.id)
    : null;
  const appearanceTheme = memberTheme ?? cookieTheme;
  const isMember = Boolean(session?.user);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="min-w-0">
          <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
            Chinese Learning Companion
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Vocabulary and review
          </p>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <NavLinks />
          {isMember ? (
            <Link
              href="/vocabulary/new"
              className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Add word
            </Link>
          ) : (
            <Link
              href="/decks"
              className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
            >
              Browse starter decks
            </Link>
          )}
          <AppearanceMenu currentTheme={appearanceTheme} />
          {isMember ? (
            <details className="group relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700 [&::-webkit-details-marker]:hidden">
                <span className="max-w-40 truncate">{userLabel}</span>
                <span className="text-xs text-slate-400 transition group-open:rotate-180 dark:text-slate-300">
                  v
                </span>
              </summary>
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
                    Signed in as
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {userLabel}
                  </p>
                </div>
                <div className="grid p-1">
                  <AccountMenuLink href="/settings">Settings</AccountMenuLink>
                  <AccountMenuLink href="/vocabulary/import">
                    Import vocabulary
                  </AccountMenuLink>
                  <AccountMenuLink href="/api/vocabulary/export">
                    Export my vocabulary
                  </AccountMenuLink>
                  <form action={signOutCurrentUser}>
                    <button
                      type="submit"
                      className="w-full rounded px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 dark:border-teal-700 dark:bg-slate-800 dark:text-teal-200 dark:hover:bg-teal-950"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

async function getMemberAppearanceTheme(userId: string) {
  const preferences = await prisma.userStudyPreference.findUnique({
    where: {
      userId,
    },
    select: {
      appearanceTheme: true,
    },
  });

  return preferences ? parseAppearanceTheme(preferences.appearanceTheme) : null;
}

function AccountMenuLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-700"
    >
      {children}
    </Link>
  );
}

function AppearanceMenu({ currentTheme }: { currentTheme: AppearanceTheme }) {
  const label = getAppearanceThemeLabel(currentTheme);

  return (
    <details className="group relative">
      <summary
        className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 [&::-webkit-details-marker]:hidden"
        aria-label={`Appearance theme: ${label}`}
      >
        <span aria-hidden="true">{getAppearanceThemeIcon(currentTheme)}</span>
        <span className="hidden sm:inline">{label}</span>
        <span className="sr-only">Appearance theme: {label}</span>
        <span className="text-xs text-slate-400 transition group-open:rotate-180 dark:text-slate-300">
          v
        </span>
      </summary>
      <form
        action={updateAppearanceTheme}
        className="absolute right-0 mt-2 grid w-44 gap-1 rounded-md bg-white p-1 shadow-lg ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
      >
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Appearance
        </p>
        <ThemeButton value="light" currentTheme={currentTheme} />
        <ThemeButton value="dark" currentTheme={currentTheme} />
        <ThemeButton value="system" currentTheme={currentTheme} />
      </form>
    </details>
  );
}

function ThemeButton({
  value,
  currentTheme,
}: {
  value: AppearanceTheme;
  currentTheme: AppearanceTheme;
}) {
  const selected = currentTheme === value;

  return (
    <button
      type="submit"
      name="appearanceTheme"
      value={value}
      className={`flex items-center gap-2 rounded px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-700 ${
        selected
          ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-100"
          : "text-slate-700 dark:text-slate-100"
      }`}
    >
      <span className="w-4 text-center text-xs text-teal-700 dark:text-teal-200">
        {selected ? "✓" : ""}
      </span>
      <span aria-hidden="true" className="w-5 text-center">
        {getAppearanceThemeIcon(value)}
      </span>
      <span>{getAppearanceThemeLabel(value)}</span>
    </button>
  );
}

function getAppearanceThemeIcon(theme: AppearanceTheme) {
  if (theme === "light") {
    return "☀";
  }

  if (theme === "dark") {
    return "☾";
  }

  return "◐";
}
