import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReviewCard } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import { shouldShowDeckStudyActions } from "@/lib/archive-rules";
import { archiveDeck } from "@/lib/decks";
import { prisma } from "@/lib/db";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";

export const dynamic = "force-dynamic";

type DeckDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DeckDetailPage({ params }: DeckDetailPageProps) {
  const { id } = await params;
  const deck = await prisma.deck.findUnique({
    where: {
      id,
    },
    include: {
      vocabularyItems: {
        where: {
          isArchived: false,
        },
        include: {
          level: true,
          reviewCard: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!deck) {
    notFound();
  }
  const showStudyActions = shouldShowDeckStudyActions(deck);
  const now = new Date();
  const activeWordCount = deck.vocabularyItems.length;
  const dueWordCount = deck.vocabularyItems.filter(
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
              {showStudyActions ? (
                <>
                  <Link
                    href={`/decks/${deck.id}/study`}
                    className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                  >
                    Study deck
                  </Link>
                  <Link
                    href={`/vocabulary/new?deckId=${deck.id}`}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Add vocabulary
                  </Link>
                  <Link
                    href={`/vocabulary/import?deckId=${deck.id}`}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Import CSV
                  </Link>
                </>
              ) : null}
              <Link
                href={`/api/vocabulary/export?deckId=${deck.id}`}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Export CSV
              </Link>
              <Link
                href={`/decks/${deck.id}/edit`}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Edit
              </Link>
              {!deck.isArchived ? (
                <form action={archiveDeck.bind(null, deck.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Archive
                  </button>
                </form>
              ) : null}
            </div>
          </div>
        </div>

        {deck.vocabularyItems.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="词"
              title="No active vocabulary in this deck"
              actionHref={!deck.isArchived ? `/vocabulary/new?deckId=${deck.id}` : undefined}
              actionLabel={!deck.isArchived ? "Add vocabulary" : undefined}
              secondaryHref={!deck.isArchived ? `/vocabulary/import?deckId=${deck.id}` : undefined}
              secondaryLabel={!deck.isArchived ? "Import CSV" : undefined}
            >
              {deck.isArchived
                ? "This archived deck has no active vocabulary to study."
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
                  <th className="px-4 py-3 font-semibold">Next review</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {deck.vocabularyItems.map((item) => (
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
                    <td className="px-4 py-4 text-slate-600">
                      {formatReviewCardDate(item.reviewCard)}
                    </td>
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
      </div>
    </main>
  );
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
