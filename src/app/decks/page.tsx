import type { ReactNode } from "react";
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
  const isMember = Boolean(user);
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

  const [decks, publicStarterDecks] = await Promise.all([
    // Owned decks count their words and due cards through the user's join rows;
    // a guest's starter-catalog list still counts the deck's own items.
    isMember
      ? prisma.deck.findMany({
          where,
          include: {
            _count: {
              select: {
                userVocabularies: {
                  where: {
                    isArchived: false,
                  },
                },
              },
            },
            userVocabularies: {
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
          orderBy: getDeckSortOrder(sort, true),
          skip,
          take: pageSize,
        }).then((items) =>
          // Normalize to the shape the list renders: "vocabularyItems" carries
          // the due-word rows and "_count.vocabularyItems" the active word count.
          items.map((deck) => ({
            ...deck,
            _count: {
              vocabularyItems: deck._count.userVocabularies,
            },
            vocabularyItems: deck.userVocabularies,
          })),
        )
      : prisma.deck.findMany({
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
          orderBy: getDeckSortOrder(sort, false),
          skip,
          take: pageSize,
        }),
    isMember
      ? prisma.deck.findMany({
          where: {
            userId: null,
            isArchived: false,
          },
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
          },
          orderBy: {
            name: "asc",
          },
          take: 6,
        })
      : Promise.resolve([]),
  ]);

  const ownedCopies =
    isMember && publicStarterDecks.length > 0
      ? await prisma.deck.findMany({
          where: {
            userId: userId,
            name: {
              in: publicStarterDecks.map((deck) => deck.name),
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];
  const ownedCopyByName = new Map(
    ownedCopies.map((deck) => [deck.name, deck.id]),
  );

  const hasFilters = Boolean(query || status !== "active" || sort !== "name");
  const firstResult = totalCount === 0 ? 0 : skip + 1;
  const lastResult = Math.min(skip + decks.length, totalCount);
  const libraryLabel = isMember ? "My library" : "Starter catalog";
  const emptyLibrary = isMember && totalCount === 0 && !hasFilters;

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">Study sets</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {isMember ? "My library and starter decks" : "Starter decks"}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              {isMember
                ? "Keep your private decks separate from built-in starter content you can copy when you are ready."
                : "Browse built-in Mandarin decks first. Sign in when you want to copy one and save progress."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isMember ? (
              <>
                <Link
                  href="/decks/new"
                  className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                >
                  Create deck
                </Link>
                <Link
                  href="/vocabulary/import"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Import your own list
                </Link>
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Sign in to copy decks
              </Link>
            )}
          </div>
        </div>

        {emptyLibrary ? (
          <OnboardingPanel starterDecks={publicStarterDecks} />
        ) : null}

        <section className="mt-6 rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">
                {libraryLabel}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {isMember ? "Private study decks" : "Built-in decks"}
              </h2>
            </div>
            {isMember ? (
              <p className="text-sm text-slate-500">
                Starter decks stay public until you copy them.
              </p>
            ) : null}
          </div>
          <form className="mt-4">
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
                ? `No ${isMember ? "private" : "starter"} decks to show.`
                : `Showing ${firstResult}-${lastResult} of ${totalCount} ${
                    isMember ? "private" : "starter"
                  } deck${totalCount === 1 ? "" : "s"}.`} {hasFilters ? "Filtered by the current controls." : ""}
            </p>
          </form>
        </section>

        {decks.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="?"
              title={
                hasFilters
                  ? "No matching decks"
                  : isMember
                    ? "No private decks yet"
                    : "No starter decks yet"
              }
              actionHref={hasFilters ? "/decks" : isMember ? "/decks" : "/login"}
              actionLabel={
                hasFilters
                  ? "Clear filters"
                  : isMember
                    ? "Browse starter decks"
                    : "Sign in to copy decks"
              }
              secondaryHref={isMember && !hasFilters ? "/vocabulary/import" : undefined}
              secondaryLabel={isMember && !hasFilters ? "Import your own list" : undefined}
            >
              {hasFilters
                ? "Try a different search, status, or sort option."
                : isMember
                  ? "Copy a starter deck into your library first, or import your own vocabulary when you have a list ready."
                  : "Starter content will appear here when public decks are available."}
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
                            {isMember
                              ? deck.isArchived
                                ? "Archived private deck"
                                : "Private deck"
                              : "Starter deck"}
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
                        {isMember ? (
                          <MetaChip label={`${dueCount} due`} tone={dueCount > 0 ? "teal" : "slate"} />
                        ) : null}
                        <MetaChip
                          label={
                            isMember
                              ? deck.isArchived
                                ? "Archived"
                                : "In my library"
                              : "Built in"
                          }
                        />
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <Link
                          href={`/decks/${deck.id}`}
                          className="inline-flex rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                        >
                          {isMember ? "Open deck" : "Open starter deck"}
                        </Link>
                        {!isMember ? (
                          <Link
                            href="/login"
                            className="inline-flex rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                          >
                            Sign in to copy
                          </Link>
                        ) : null}
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

        {isMember ? (
          <StarterCatalogSection
            decks={publicStarterDecks}
            ownedCopyByName={ownedCopyByName}
          />
        ) : null}
      </div>
    </main>
  );
}

function OnboardingPanel({
  starterDecks,
}: {
  starterDecks: Array<{
    id: string;
    name: string;
    description: string | null;
    _count: {
      vocabularyItems: number;
    };
  }>;
}) {
  const firstStarterDeck = starterDecks[0];

  return (
    <section className="mt-6 rounded-md bg-teal-50 p-5 ring-1 ring-teal-100 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-teal-800">
            New library
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Start with a built-in deck
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-950">
            Copy a starter deck to create your private study copy, then review
            and reset progress without changing the public catalog.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {firstStarterDeck ? (
              <Link
                href={`/decks/${firstStarterDeck.id}`}
                className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Copy a starter deck
              </Link>
            ) : null}
            <Link
              href="/vocabulary/import"
              className="inline-flex items-center justify-center rounded-md border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100"
            >
              Import your own list
            </Link>
          </div>
        </div>
        <div className="rounded-md bg-white p-4 ring-1 ring-teal-100">
          <p className="text-sm font-semibold text-slate-900">
            Best first steps
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>1. Open a starter deck.</li>
            <li>2. Copy it into your library.</li>
            <li>3. Study and save your own progress.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

function StarterCatalogSection({
  decks,
  ownedCopyByName,
}: {
  decks: Array<{
    id: string;
    name: string;
    description: string | null;
    _count: {
      vocabularyItems: number;
    };
  }>;
  ownedCopyByName: Map<string, string>;
}) {
  if (decks.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-700">
            Starter catalog
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Built-in decks to copy
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Starter decks are public and read-only. Copy one into your private
            library before saving progress.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => {
          const copiedDeckId = ownedCopyByName.get(deck.name);

          return (
            <article
              key={deck.id}
              className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                    Starter deck
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {deck.name}
                  </h3>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                  {deck._count.vocabularyItems} word
                  {deck._count.vocabularyItems === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-3 min-h-16 text-sm leading-6 text-slate-600">
                {deck.description ?? "A built-in deck for getting started."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {copiedDeckId ? (
                  <Link
                    href={`/decks/${copiedDeckId}`}
                    className="inline-flex rounded-md border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                  >
                    Already in your library
                  </Link>
                ) : (
                  <Link
                    href={`/decks/${deck.id}`}
                    className="inline-flex rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                  >
                    Copy option
                  </Link>
                )}
                <Link
                  href={`/decks/${deck.id}`}
                  className="inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Preview
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
  children: ReactNode;
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

function getDeckSortOrder(
  sort: SortOption,
  isMember: boolean,
): Prisma.DeckOrderByWithRelationInput[] {
  if (sort === "newest") {
    return [{ createdAt: "desc" }];
  }

  if (sort === "word-count") {
    return isMember
      ? [{ userVocabularies: { _count: "desc" } }, { name: "asc" }]
      : [{ vocabularyItems: { _count: "desc" } }, { name: "asc" }];
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