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

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="min-w-0">
          <p className="text-base font-semibold text-slate-950">
            Chinese Learning Companion
          </p>
          <p className="text-sm text-slate-500">Vocabulary and review</p>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <NavLinks />
          <Link
            href="/vocabulary/new"
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Add word
          </Link>
          <AppearanceMenu currentTheme={appearanceTheme} />
          {session?.user ? (
            <details className="group relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <span className="max-w-40 truncate">{userLabel}</span>
                <span className="text-xs text-slate-400 transition group-open:rotate-180">
                  v
                </span>
              </summary>
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-slate-200">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Signed in as
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">
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
                      className="w-full rounded px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
              className="rounded-md border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
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
      className="rounded px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function AppearanceMenu({ currentTheme }: { currentTheme: AppearanceTheme }) {
  return (
    <details className="group relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <span>{getAppearanceThemeLabel(currentTheme)}</span>
        <span className="text-xs text-slate-400 transition group-open:rotate-180">
          v
        </span>
      </summary>
      <form
        action={updateAppearanceTheme}
        className="absolute right-0 mt-2 grid w-44 gap-1 rounded-md bg-white p-1 shadow-lg ring-1 ring-slate-200"
      >
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
  return (
    <button
      type="submit"
      name="appearanceTheme"
      value={value}
      className={`rounded px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-50 ${
        currentTheme === value ? "bg-teal-50 text-teal-800" : "text-slate-700"
      }`}
    >
      {getAppearanceThemeLabel(value)}
    </button>
  );
}