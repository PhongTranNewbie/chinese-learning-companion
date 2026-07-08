import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const pageSize = 12;
const statusOptions = ["active", "archived"] as const;
const sortOptions = ["name", "newest", "word-count"] as const;

type StatusFilter = (typeof statusOptions)[number];
type SortOption = (typeof sortOptions)[number];

type DecksPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function DecksPage({ searchParams }: DecksPageProps) {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = parseStatus(params.status);
  const sort = parseSort(params.sort);
  const requestedPage = parsePage(params.page);
  const now = new Date();

  const where: Prisma.DeckWhereInput = {
    userId,
    isArchived: status === "archived",
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        }
      : {}),
  };

  const totalCount = await prisma.deck.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const decks = await prisma.deck.findMany({
    where,
    include: {
      _count: {
        select: {
          vocabularyItems: {
            where: {
              isArchived: false,
            },
          },
        },
      },
      vocabularyItems: {
        where: {
          isArchived: false,
          reviewCard: {
            status: "ACTIVE",
            dueAt: {
              lte: now,
            },
          },
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: getDeckSortOrder(sort),
    skip,
    take: pageSize,
  });

  const hasFilters = Boolean(query || status !== "active" || sort !== "name");
  const firstResult = totalCount === 0 ? 0 : skip + 1;
  const lastResult = Math.min(skip + decks.length, totalCount);

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">Study sets</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Study decks
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Find the right deck, see what is due, and keep growing study sets
              easy to browse.
            </p>
          </div>
          <Link
            href="/decks/new"
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Create deck
          </Link>
        </div>

        <form className="mt-6 rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Search
              </span>
              <input
                name="q"
                defaultValue={query}
                placeholder="Deck name or description"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                name="status"
                defaultValue={status}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="active">Active decks</option>
                <option value="archived">Archived decks</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Sort</span>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="name">Name</option>
                <option value="newest">Newest</option>
                <option value="word-count">Word count</option>
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
                href="/decks"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset
              </Link>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {totalCount === 0
              ? "No decks to show."
              : `Showing ${firstResult}-${lastResult} of ${totalCount} deck${
                  totalCount === 1 ? "" : "s"
                }.`} {hasFilters ? "Filtered by the current controls." : ""}
          </p>
        </form>

        {decks.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="组"
              title={hasFilters ? "No matching decks" : "No active decks yet"}
              actionHref={hasFilters ? "/decks" : "/decks/new"}
              actionLabel={hasFilters ? "Clear filters" : "Create deck"}
            >
              {hasFilters
                ? "Try a different search, status, or sort option."
                : "Create a deck to organize related vocabulary into a focused study set."}
            </EmptyState>
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2">
              {decks.map((deck) => {
                const wordCount = deck._count.vocabularyItems;
                const dueCount = deck.vocabularyItems.length;

                return (
                  <article
                    key={deck.id}
                    className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                            {deck.isArchived ? "Archived deck" : "Study deck"}
                          </p>
                          <h2 className="mt-2 text-xl font-semibold text-slate-950">
                            {deck.name}
                          </h2>
                        </div>
                        <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                          {wordCount} word{wordCount === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="mt-3 min-h-10 text-sm leading-6 text-slate-600">
                        {deck.description ?? "A focused place for related words."}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <MetaChip label={`${dueCount} due`} tone={dueCount > 0 ? "teal" : "slate"} />
                        <MetaChip label={deck.isArchived ? "Archived" : "Active"} />
                      </div>
                      <div className="mt-5">
                        <Link
                          href={`/decks/${deck.id}`}
                          className="inline-flex rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                        >
                          Open deck
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <Pagination
              basePath="/decks"
              currentPage={currentPage}
              totalPages={totalPages}
              params={{ query, status, sort }}
            />
          </>
        )}
      </div>
    </main>
  );
}

function Pagination({
  basePath,
  currentPage,
  totalPages,
  params,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  params: {
    query: string;
    status: StatusFilter;
    sort: SortOption;
  };
}) {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav className="mt-5 flex flex-col gap-3 rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        <PaginationLink
          href={buildListHref(basePath, params, currentPage - 1)}
          disabled={isFirstPage}
        >
          Previous
        </PaginationLink>
        <PaginationLink
          href={buildListHref(basePath, params, currentPage + 1)}
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

function MetaChip({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "teal" | "slate";
}) {
  const toneClass =
    tone === "teal"
      ? "bg-teal-50 text-teal-800 ring-teal-100"
      : "bg-slate-50 text-slate-600 ring-slate-100";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${toneClass}`}>
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
    : "name";
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getDeckSortOrder(sort: SortOption): Prisma.DeckOrderByWithRelationInput[] {
  if (sort === "newest") {
    return [{ createdAt: "desc" }];
  }

  if (sort === "word-count") {
    return [{ vocabularyItems: { _count: "desc" } }, { name: "asc" }];
  }

  return [{ name: "asc" }];
}

function buildListHref(
  basePath: string,
  params: {
    query: string;
    status: StatusFilter;
    sort: SortOption;
  },
  page: number,
) {
  const search = new URLSearchParams();

  if (params.query) {
    search.set("q", params.query);
  }

  if (params.status !== "active") {
    search.set("status", params.status);
  }

  if (params.sort !== "name") {
    search.set("sort", params.sort);
  }

  if (page > 1) {
    search.set("page", String(page));
  }

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}