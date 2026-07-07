import Link from "next/link";
import { auth } from "@/auth";
import { signOutCurrentUser } from "@/lib/auth-actions";
import { NavLinks } from "@/components/nav-links";

export async function AppNav() {
  const session = await auth();
  const userLabel = session?.user?.name ?? session?.user?.email ?? "Member";

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
          {session?.user ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">
              <span className="max-w-44 truncate px-2 text-sm font-medium text-slate-600">
                {userLabel}
              </span>
              <form action={signOutCurrentUser}>
                <button
                  type="submit"
                  className="rounded px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Log out
                </button>
              </form>
            </div>
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
