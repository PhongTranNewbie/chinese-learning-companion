import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/change-password-form";
import {
  appearanceThemes,
  getAppearanceThemeLabel,
} from "@/lib/appearance";
import { prisma } from "@/lib/db";
import {
  updateAppearanceTheme,
  updateDisplayName,
  updateStudyPreferences,
} from "@/lib/settings";
import { getStudyPreferences } from "@/lib/study-preferences";

export const dynamic = "force-dynamic";

type SettingsPageProps = {
  searchParams: Promise<{
    profile?: string;
    preferences?: string;
    appearance?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const now = new Date();
  const [user, preferences, memberStats, ownedDecks, publicStarterDecks] =
    await Promise.all([
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
      getMemberStats(session.user.id, now),
      prisma.deck.findMany({
        where: {
          userId: session.user.id,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              userVocabularies: {
                where: {
                  isArchived: false,
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        take: 5,
      }),
      prisma.deck.findMany({
        where: {
          userId: null,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              vocabularyItems: true,
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        take: 4,
      }),
    ]);

  if (!user) {
    redirect("/login");
  }

  const loginMethods = [
    user.passwordHash ? "Email and password" : null,
    ...user.accounts.map((account) => formatProvider(account.provider)),
  ].filter(Boolean);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
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
          {params.appearance === "updated" ? (
            <StatusMessage>Appearance updated.</StatusMessage>
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
            <h2 className="text-xl font-semibold text-slate-950">
              Appearance
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Choose a calm light theme, a soft dark theme, or follow your
              device setting.
            </p>
            <form action={updateAppearanceTheme} className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {appearanceThemes.map((theme) => (
                  <label
                    key={theme}
                    className="flex cursor-pointer items-start gap-3 rounded-md bg-slate-50 p-4 ring-1 ring-slate-100 transition hover:bg-teal-50"
                  >
                    <input
                      type="radio"
                      name="appearanceTheme"
                      value={theme}
                      defaultChecked={preferences.appearanceTheme === theme}
                      className="mt-1 h-4 w-4 border-slate-300 text-teal-700 focus:ring-teal-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-800">
                        {getAppearanceThemeLabel(theme)}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        {getAppearanceDescription(theme)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                >
                  Save appearance
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Data management
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Import words, export your private library, copy starter decks, and
              manage review progress from the deck pages where those cards live.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard label="My vocabulary" value={memberStats.vocabularyCount} />
              <StatCard label="My decks" value={memberStats.deckCount} />
              <StatCard label="Due reviews" value={memberStats.dueReviewCount} />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <DataToolCard
                title="Import vocabulary"
                description="Add words to your private library from a small manual CSV."
                href="/vocabulary/import"
                cta="Import CSV"
                variant="primary"
              />
              <DataToolCard
                title="Export my vocabulary"
                description="Download your own active vocabulary. Public starter rows stay separate."
                href="/api/vocabulary/export"
                cta="Export CSV"
              />
              <DataToolCard
                title="Browse starter decks"
                description="Copy a public starter deck into your private library before saving progress."
                href="/decks"
                cta="Open decks"
              />
              <DataToolCard
                title="Manage decks and progress"
                description="Open an owned deck to study, export one deck, or reset that deck's review progress."
                href="/decks"
                cta="Manage my decks"
              />
            </div>

            {publicStarterDecks.length > 0 ? (
              <div className="mt-6 rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Public starter decks
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Open a starter deck to copy it into your private library.
                    </p>
                  </div>
                  <Link
                    href="/decks"
                    className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                  >
                    View my decks
                  </Link>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {publicStarterDecks.map((deck) => (
                    <DeckLinkRow
                      key={deck.id}
                      href={`/decks/${deck.id}`}
                      name={deck.name}
                      detail={`${deck._count.vocabularyItems} word${
                        deck._count.vocabularyItems === 1 ? "" : "s"
                      }`}
                      action="Copy option"
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Owned deck tools
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Reset review progress from a specific owned deck page. There
                    is no global reset-all action.
                  </p>
                </div>
                <Link
                  href="/decks"
                  className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
                >
                  All decks
                </Link>
              </div>
              {ownedDecks.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {ownedDecks.map((deck) => (
                    <DeckLinkRow
                      key={deck.id}
                      href={`/decks/${deck.id}`}
                      name={deck.name}
                      detail={`${deck._count.userVocabularies} word${
                        deck._count.userVocabularies === 1 ? "" : "s"
                      }`}
                      action="Manage"
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Copy a starter deck or create your own deck to unlock per-deck
                  study and reset tools.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">Security</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Manage password access for accounts that use email sign-in.
            </p>
            {user.passwordHash ? (
              <ChangePasswordForm />
            ) : (
              <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-100">
                This account uses OAuth sign-in. Password change is not
                available for provider-only accounts.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

async function getMemberStats(userId: string, now: Date) {
  const [vocabularyCount, deckCount, dueReviewCount] = await Promise.all([
    prisma.userVocabulary.count({
      where: {
        userId,
        isArchived: false,
      },
    }),
    prisma.deck.count({
      where: {
        userId,
        isArchived: false,
      },
    }),
    prisma.reviewCard.count({
      where: {
        status: "ACTIVE",
        dueAt: {
          lte: now,
        },
        userVocabulary: {
          userId,
          isArchived: false,
        },
      },
    }),
  ]);

  return {
    vocabularyCount,
    deckCount,
    dueReviewCount,
  };
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DataToolCard({
  title,
  description,
  href,
  cta,
  variant = "secondary",
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  variant?: "primary" | "secondary";
}) {
  const linkClass =
    variant === "primary"
      ? "bg-teal-700 text-white shadow-sm hover:bg-teal-800"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <article className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
        {description}
      </p>
      <Link
        href={href}
        className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition ${linkClass}`}
      >
        {cta}
      </Link>
    </article>
  );
}

function DeckLinkRow({
  href,
  name,
  detail,
  action,
}: {
  href: string;
  name: string;
  detail: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-3 text-sm ring-1 ring-slate-100 transition hover:bg-teal-50"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-900">
          {name}
        </span>
        <span className="mt-1 block text-xs text-slate-500">{detail}</span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-teal-700">
        {action}
      </span>
    </Link>
  );
}

function StatusMessage({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950 ring-1 ring-teal-100">
      {children}
    </div>
  );
}

function getAppearanceDescription(theme: "light" | "dark" | "system") {
  if (theme === "light") {
    return "Use the bright default study surface.";
  }

  if (theme === "dark") {
    return "Use a soft dark surface for low-light study.";
  }

  return "Follow your device appearance setting.";
}

function formatProvider(provider: string) {
  if (provider === "google") {
    return "Google";
  }

  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
