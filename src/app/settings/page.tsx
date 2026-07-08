import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { updateDisplayName, updateStudyPreferences } from "@/lib/settings";
import { getStudyPreferences } from "@/lib/study-preferences";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{
    profile?: string;
    preferences?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, preferences] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
        name: true,
        passwordHash: true,
        accounts: {
          select: {
            provider: true,
          },
          orderBy: {
            provider: "asc",
          },
        },
      },
    }),
    getStudyPreferences(session.user.id),
  ]);

  if (!user) {
    redirect("/login");
  }

  const loginMethods = [
    user.passwordHash ? "Email and password" : null,
    ...user.accounts.map((account) => formatProvider(account.provider)),
  ].filter(Boolean);

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">Account</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Tune your study sessions and keep your account details tidy.
            </p>
          </div>
          <Link
            href="/review"
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Start review
          </Link>
        </div>

        <div className="mt-8 grid gap-5">
          {params.profile === "updated" ? (
            <StatusMessage>Display name updated.</StatusMessage>
          ) : null}
          {params.preferences === "updated" ? (
            <StatusMessage>Study preferences saved.</StatusMessage>
          ) : null}

          <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">Profile</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Your email stays read-only for now. Display name is used in the
              header and account menu.
            </p>
            <form action={updateDisplayName} className="mt-5 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Display name
                </span>
                <input
                  name="name"
                  defaultValue={user.name ?? ""}
                  placeholder="Your study name"
                  className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Email" value={user.email ?? "Not set"} />
                <ReadOnlyField
                  label="Login method"
                  value={loginMethods.join(", ") || "Account provider"}
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                >
                  Save profile
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Study preferences
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Session sizes apply to Review and Deck Study. Memory aids control
              whether mnemonic sections appear after reveal.
            </p>
            <form action={updateStudyPreferences} className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <NumberField
                  label="Daily review goal"
                  name="dailyReviewGoal"
                  defaultValue={preferences.dailyReviewGoal}
                />
                <NumberField
                  label="Review session size"
                  name="reviewSessionSize"
                  defaultValue={preferences.reviewSessionSize}
                />
                <NumberField
                  label="Deck study session size"
                  name="deckStudySessionSize"
                  defaultValue={preferences.deckStudySessionSize}
                />
              </div>
              <label className="flex items-start gap-3 rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
                <input
                  type="checkbox"
                  name="showMemoryAidOnReveal"
                  defaultChecked={preferences.showMemoryAidOnReveal}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Show memory aid after reveal
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    Keep examples visible either way; this only hides mnemonic
                    and component hints during study sessions.
                  </span>
                </span>
              </label>
              <div>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                >
                  Save preferences
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">Data tools</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Bring in a small CSV vocabulary list or export your own saved
              words.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/vocabulary/import"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Import vocabulary
              </Link>
              <Link
                href="/api/vocabulary/export"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Export my vocabulary
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="number"
        name={name}
        min={1}
        max={50}
        defaultValue={defaultValue}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function StatusMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950 ring-1 ring-teal-100">
      {children}
    </div>
  );
}

function formatProvider(provider: string) {
  if (provider === "google") {
    return "Google";
  }

  return provider.charAt(0).toUpperCase() + provider.slice(1);
}