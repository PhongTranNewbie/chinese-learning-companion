import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReviewCard } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { shouldShowDeckStudyActions } from "@/lib/archive-rules";
import {
  archiveDeck,
  copyPublicDeckToLibrary,
  resetDeckReviewProgress,
} from "@/lib/decks";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";

export const dynamic = "force-dynamic";

type DeckDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    progress?: string;
  }>;
};

export default async function DeckDetailPage({
  params,
  searchParams,
}: DeckDetailPageProps) {
  const user = await getCurrentUser();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const deck = await prisma.deck.findFirst({
    where: {
      id,
      OR: user ? [{ userId: user.id }, { userId: null }] : [{ userId: null }],
    },
  });

  if (!deck) {
    notFound();
  }

  const isPublicDeck = deck.userId === null;
  const ownedCopy =
    user && isPublicDeck
      ? await prisma.deck.findFirst({
          where: {
            userId: user.id,
            name: deck.name,
          },
          select: {
            id: true,
          },
        })
      : null;
  const showStudyActions = shouldShowDeckStudyActions(deck);
  const canMutateDeck = Boolean(user && !isPublicDeck);
  const showResetProgress = canMutateDeck && !deck.isArchived;
  const now = new Date();
  // A public/template deck lists its shared catalog items (they carry no
  // per-user cards); an owned deck reads the signed-in user's join rows for it.
  const vocabularyItems =
    !isPublicDeck && user
      ? await getOwnedDeckItems(user.id, deck.id)
      : await prisma.vocabularyItem
          .findMany({
            where: {
              deckId: deck.id,
            },
            include: {
              level: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          })
          .then((items) => items.map((item) => ({ ...item, reviewCard: null })));
  const activeWordCount = vocabularyItems.length;
  const dueWordCount = vocabularyItems.filter(
    (item) =>
      item.reviewCard?.status === "ACTIVE" && item.reviewCard.dueAt <= now,
  ).length;

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/decks"
                className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
              >
                Back to decks
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                  {deck.name}
                </h1>
                {isPublicDeck ? (
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 ring-1 ring-teal-100">
                    Starter deck
                  </span>
                ) : null}
                {deck.isArchived ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    Archived
                  </span>
                ) : null}
              </div>
              <p className="mt-2 max-w-2xl text-slate-600">
                {deck.description ?? "A focused place for related words."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <SummaryPill
                  label={`${activeWordCount} active word${
                    activeWordCount === 1 ? "" : "s"
                  }`}
                />
                <SummaryPill
                  label={`${dueWordCount} due for review`}
                  tone={dueWordCount > 0 ? "teal" : "slate"}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {isPublicDeck && !deck.isArchived ? (
                user ? (
                  ownedCopy ? (
                    <Link
                      href={`/decks/${ownedCopy.id}`}
                      className="rounded-md border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
                    >
                      Already in your library
                    </Link>
                  ) : (
                    <form action={copyPublicDeckToLibrary.bind(null, deck.id)}>
                      <PendingSubmitButton
                        idleLabel="Copy to my library"
                        pendingLabel="Copying..."
                        className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                      />
                    </form>
                  )
                ) : (
                  <Link
                    href="/login"
                    className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                  >
                    Sign in to copy this deck
                  </Link>
                )
              ) : null}
              {showStudyActions ? (
                <>
                  {!user || !isPublicDeck ? (
                    <Link
                      href={`/decks/${deck.id}/study`}
                      className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                    >
                      Study deck
                    </Link>
                  ) : null}
                  {canMutateDeck ? (
                    <Link
                      href={`/vocabulary/new?deckId=${deck.id}`}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Add vocabulary
                    </Link>
                  ) : null}
                  {canMutateDeck ? (
                    <Link
                      href={`/vocabulary/import?deckId=${deck.id}`}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Import CSV
                    </Link>
                  ) : null}
                </>
              ) : null}
              {canMutateDeck ? (
                <Link
                  href={`/api/vocabulary/export?deckId=${deck.id}`}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Export CSV
                </Link>
              ) : null}
              {canMutateDeck ? (
                <Link
                  href={`/decks/${deck.id}/edit`}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit
                </Link>
              ) : null}
              {canMutateDeck && !deck.isArchived ? (
                <form action={archiveDeck.bind(null, deck.id)}>
                  <PendingSubmitButton
                    idleLabel="Archive"
                    pendingLabel="Archiving..."
                    className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  />
                </form>
              ) : null}
            </div>
          </div>
        </div>

        {query.progress === "reset" ? (
          <div className="mt-5 rounded-md bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-950 ring-1 ring-teal-100">
            Review progress reset. These words are ready to study again.
          </div>
        ) : null}

        {vocabularyItems.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="词"
              title="No active vocabulary in this deck"
              actionHref={
                canMutateDeck && !deck.isArchived
                  ? `/vocabulary/new?deckId=${deck.id}`
                  : undefined
              }
              actionLabel={
                canMutateDeck && !deck.isArchived ? "Add vocabulary" : undefined
              }
              secondaryHref={
                canMutateDeck && !deck.isArchived
                  ? `/vocabulary/import?deckId=${deck.id}`
                  : undefined
              }
              secondaryLabel={
                canMutateDeck && !deck.isArchived ? "Import CSV" : undefined
              }
            >
              {deck.isArchived
                ? "This archived deck has no active vocabulary to study."
                : isPublicDeck
                  ? "Copy this starter deck to add your own review progress."
                  : "Add or import words to turn this deck into a focused study set."}
            </EmptyState>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-md bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Word</th>
                  <th className="px-4 py-3 font-semibold">Meaning</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  {!isPublicDeck ? (
                    <th className="px-4 py-3 font-semibold">Next review</th>
                  ) : null}
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {vocabularyItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <p className="text-2xl font-semibold leading-none text-teal-700">
                        {item.hanzi}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        {formatPinyinForDisplay(item.pinyin)}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {item.meaning}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
                        {item.level?.name ?? "No level"}
                      </span>
                    </td>
                    {!isPublicDeck ? (
                      <td className="px-4 py-4 text-slate-600">
                        {formatReviewCardDate(item.reviewCard)}
                      </td>
                    ) : null}
                    <td className="px-4 py-4">
                      <Link
                        href={`/vocabulary/${item.id}`}
                        className="font-semibold text-teal-700 transition hover:text-teal-800"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showResetProgress ? (
          <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-red-100 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Reset review progress
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  This keeps your words, examples, memory aids, and character
                  notes, but resets review timing for this deck so every card is
                  ready to study again.
                </p>
              </div>
              <form
                action={resetDeckReviewProgress.bind(null, deck.id)}
                className="grid gap-3 rounded-md bg-red-50 p-4 ring-1 ring-red-100 lg:min-w-80"
              >
                <label className="flex items-start gap-3 text-sm leading-6 text-red-950">
                  <input
                    type="checkbox"
                    name="confirmReset"
                    required
                    className="mt-1 h-4 w-4 rounded border-red-300 text-red-700 focus:ring-red-600"
                  />
                  <span>I understand this resets review progress for this deck.</span>
                </label>
                <PendingSubmitButton
                  idleLabel="Reset progress"
                  pendingLabel="Resetting..."
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                />
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

/**
 * An owned deck's active words come from the user's join rows for that deck.
 * Catalog scalars read through the join's catalog entry; per-user meaning and
 * the review card come from the join itself. Word detail URLs point at the
 * catalog entry (the shared id).
 */
async function getOwnedDeckItems(userId: string, deckId: string) {
  const userVocabularies = await prisma.userVocabulary.findMany({
    where: {
      userId,
      deckId,
      isArchived: false,
    },
    include: {
      reviewCard: true,
      vocabularyItem: {
        include: {
          level: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return userVocabularies.map((uv) => ({
    id: uv.vocabularyItem.id,
    hanzi: uv.vocabularyItem.hanzi,
    pinyin: uv.vocabularyItem.pinyin,
    meaning: uv.personalMeaning ?? uv.vocabularyItem.meaning,
    level: uv.vocabularyItem.level,
    reviewCard: uv.reviewCard,
  }));
}

function SummaryPill({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "teal";
}) {
  const className =
    tone === "teal"
      ? "bg-teal-50 text-teal-700 ring-teal-100"
      : "bg-slate-50 text-slate-600 ring-slate-100";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${className}`}>
      {label}
    </span>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function formatReviewCardDate(reviewCard: ReviewCard | null) {
  if (!reviewCard) {
    return "Missing";
  }

  if (reviewCard.status !== "ACTIVE") {
    return "Not active";
  }

  return formatDate(reviewCard.dueAt);
}
