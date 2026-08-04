import Link from "next/link";
import type { Prisma, ReviewCard } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";

export const dynamic = "force-dynamic";

const pageSize = 12;
const statusOptions = ["active", "due", "archived", "not-active"] as const;
const sortOptions = ["newest", "hanzi", "due", "deck"] as const;

type StatusFilter = (typeof statusOptions)[number];
type SortOption = (typeof sortOptions)[number];

type VocabularyPageProps = {
  searchParams: Promise<{
    q?: string;
    deck?: string;
    deckId?: string;
    levelId?: string;
    status?: string;
    sort?: string;
    page?: string;
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
  const deckId = params.deck?.trim() || params.deckId?.trim() || "";
  const status = parseStatus(params.status);
  const sort = parseSort(params.sort);
  const requestedPage = parsePage(params.page);
  const now = new Date();

  const where: Prisma.VocabularyItemWhereInput = {
    userId,
    ...(levelId ? { levelId } : {}),
    ...(deckId ? { deckId } : {}),
    ...getStatusWhere(status, now),
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

  const totalCount = await prisma.vocabularyItem.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const vocabularyItems = await prisma.vocabularyItem.findMany({
    where,
    include: {
      deck: true,
      level: true,
      reviewCard: true,
    },
    orderBy: getSortOrder(sort),
    skip,
    take: pageSize,
  });

  const hasFilters = Boolean(
    query || levelId || deckId || status !== "active" || sort !== "newest",
  );
  const firstResult = totalCount === 0 ? 0 : skip + 1;
  const lastResult = Math.min(skip + vocabularyItems.length, totalCount);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">
              Vocabulary library
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl dark:text-slate-50">
              Saved words
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              Search vocabulary, filter your study list, and keep longer word
              libraries easy to scan.
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

        <form className="mt-6 rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_160px_160px_auto]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Search
              </span>
              <input
                name="q"
                defaultValue={query}
                placeholder="Hanzi, pinyin, or meaning"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Deck</span>
              <select
                name="deck"
                defaultValue={deckId}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
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
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Level</span>
              <select
                name="levelId"
                defaultValue={levelId}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="">All levels</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</span>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="active">Active words</option>
                <option value="due">Due for review</option>
                <option value="archived">Archived words</option>
                <option value="not-active">Not active</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Sort</span>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="newest">Newest</option>
                <option value="hanzi">Hanzi</option>
                <option value="due">Next review</option>
                <option value="deck">Deck</option>
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
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {totalCount === 0
              ? "No words to show."
              : `Showing ${firstResult}-${lastResult} of ${totalCount} word${
                  totalCount === 1 ? "" : "s"
                }.`} {hasFilters ? "Filtered by the current controls." : ""}
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
                ? "Try a different search, deck, status, level, or sort option."
                : "Add your first word to create its initial review card."}
            </EmptyState>
          </div>
        ) : (
          <>
            <div className="mt-8 overflow-x-auto rounded-md bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Word</th>
                    <th className="px-3 py-3 font-semibold">Meaning</th>
                    <th className="px-3 py-3 font-semibold">Deck</th>
                    <th className="px-3 py-3 font-semibold">Level</th>
                    <th className="px-3 py-3 font-semibold">Next review</th>
                    <th className="px-3 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                 <tbody>
                  {vocabularyItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-700 dark:hover:bg-slate-700/70"
                    >
                      <td className="px-3 py-4">
                        <p className="text-2xl font-semibold leading-none text-teal-700 dark:text-teal-400">
                          {item.hanzi}
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                          {formatPinyinForDisplay(item.pinyin)}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-700 dark:text-slate-300">
                        {item.meaning}
                      </td>
                      <td className="px-3 py-4">
                        <MetaChip label={item.deck?.name ?? "No deck"} />
                      </td>
                      <td className="px-3 py-4">
                        <MetaChip label={item.level?.name ?? "No level"} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-slate-600 dark:text-slate-400">
                        {formatReviewCardDate(item.reviewCard)}
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          href={`/vocabulary/${item.id}`}
                          className="font-semibold text-teal-700 transition hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              params={{ query, deckId, levelId, status, sort }}
            />
          </>
        )}
      </div>
    </main>
  );
}

function Pagination({
  currentPage,
  totalPages,
  params,
}: {
  currentPage: number;
  totalPages: number;
  params: {
    query: string;
    deckId: string;
    levelId: string;
    status: StatusFilter;
    sort: SortOption;
  };
}) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav className="mt-5 flex flex-col gap-3 rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-800 dark:ring-slate-700">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        <PaginationLink
          href={buildVocabularyHref(params, currentPage - 1)}
          disabled={isFirstPage}
        >
          Previous
        </PaginationLink>
        <PaginationLink
          href={buildVocabularyHref(params, currentPage + 1)}
          disabled={isLastPage}
        >
          Next
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600">
      {label}
    </span>
  );
}

function parseStatus(value: string | undefined): StatusFilter {
  return statusOptions.includes(value as StatusFilter)
    ? (value as StatusFilter)
    : "active";
}

function parseSort(value: string | undefined): SortOption {
  return sortOptions.includes(value as SortOption)
    ? (value as SortOption)
    : "newest";
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getStatusWhere(
  status: StatusFilter,
  now: Date,
): Prisma.VocabularyItemWhereInput {
  if (status === "archived") {
    return { isArchived: true };
  }

  if (status === "due") {
    return {
      isArchived: false,
      reviewCard: {
        is: {
          status: "ACTIVE",
          dueAt: {
            lte: now,
          },
        },
      },
    };
  }

  if (status === "not-active") {
    return {
      isArchived: false,
      OR: [
        {
          reviewCard: {
            is: null,
          },
        },
        {
          reviewCard: {
            is: {
              status: {
                not: "ACTIVE",
              },
            },
          },
        },
      ],
    };
  }

  return { isArchived: false };
}

function getSortOrder(sort: SortOption): Prisma.VocabularyItemOrderByWithRelationInput[] {
  if (sort === "hanzi") {
    return [{ hanzi: "asc" }, { createdAt: "desc" }];
  }

  if (sort === "due") {
    return [{ reviewCard: { dueAt: "asc" } }, { createdAt: "desc" }];
  }

  if (sort === "deck") {
    return [{ deck: { name: "asc" } }, { createdAt: "desc" }];
  }

  return [{ createdAt: "desc" }];
}

function buildVocabularyHref(
  params: {
    query: string;
    deckId: string;
    levelId: string;
    status: StatusFilter;
    sort: SortOption;
  },
  page: number,
) {
  const search = new URLSearchParams();

  if (params.query) {
    search.set("q", params.query);
  }

  if (params.deckId) {
    search.set("deck", params.deckId);
  }

  if (params.levelId) {
    search.set("levelId", params.levelId);
  }

  if (params.status !== "active") {
    search.set("status", params.status);
  }

  if (params.sort !== "newest") {
    search.set("sort", params.sort);
  }

  if (page > 1) {
    search.set("page", String(page));
  }

  const query = search.toString();
  return query ? `/vocabulary?${query}` : "/vocabulary";
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