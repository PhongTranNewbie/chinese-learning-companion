import Link from "next/link";
import type { Prisma, ReviewCard } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";

export const dynamic = "force-dynamic";

type VocabularyPageProps = {
  searchParams: Promise<{
    q?: string;
    levelId?: string;
    deckId?: string;
  }>;
};

export default async function VocabularyPage({
  searchParams,
}: VocabularyPageProps) {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const [levels, decks] = await Promise.all([
    prisma.level.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    }),
    prisma.deck.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const levelId = params.levelId?.trim() ?? "";
  const deckId = params.deckId?.trim() ?? "";

  const where: Prisma.VocabularyItemWhereInput = {
    userId,
    isArchived: false,
    ...(levelId ? { levelId } : {}),
    ...(deckId ? { deckId } : {}),
    ...(query
      ? {
          OR: [
            { hanzi: { contains: query } },
            { pinyin: { contains: query } },
            { meaning: { contains: query } },
          ],
        }
      : {}),
  };

  const vocabularyItems = await prisma.vocabularyItem.findMany({
    where,
    include: {
      deck: true,
      level: true,
      reviewCard: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const hasFilters = Boolean(query || levelId || deckId);

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Vocabulary library
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Saved words
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Search active vocabulary, filter by deck or level, and export CSV.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/vocabulary/import"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Import CSV
            </Link>
            <Link
              href={`/api/vocabulary/export${deckId ? `?deckId=${deckId}` : ""}`}
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Export CSV
            </Link>
            <Link
              href="/vocabulary/new"
              className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Add vocabulary
            </Link>
          </div>
        </div>

        <form className="mt-6 rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="grid gap-4 md:grid-cols-[1fr_200px_200px_auto]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Search
              </span>
              <input
                name="q"
                defaultValue={query}
                placeholder="Hanzi, pinyin, or meaning"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Deck</span>
              <select
                name="deckId"
                defaultValue={deckId}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All active decks</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Level</span>
              <select
                name="levelId"
                defaultValue={levelId}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="">All active levels</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Apply
              </button>
              <Link
                href="/vocabulary"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </Link>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Showing {vocabularyItems.length} active word
            {vocabularyItems.length === 1 ? "" : "s"}
            {hasFilters ? " for the current filters." : "."}
          </p>
        </form>

      {vocabularyItems.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="词"
              title={hasFilters ? "No matching vocabulary" : "No vocabulary yet"}
              actionHref={hasFilters ? "/vocabulary" : "/vocabulary/new"}
              actionLabel={hasFilters ? "Clear filters" : "Add vocabulary"}
            >
              {hasFilters
                ? "Try a different search, deck, or level filter."
                : "Add your first word to create its initial review card."}
            </EmptyState>
          </div>
      ) : (
          <div className="mt-8 overflow-x-auto rounded-md bg-white shadow-sm ring-1 ring-slate-100">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Word</th>
                  <th className="px-4 py-3 font-semibold">Meaning</th>
                  <th className="px-4 py-3 font-semibold">Deck</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Next review</th>
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
                      <MetaChip label={item.deck?.name ?? "No deck"} />
                    </td>
                    <td className="px-4 py-4">
                      <MetaChip label={item.level?.name ?? "No level"} />
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

function MetaChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
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
