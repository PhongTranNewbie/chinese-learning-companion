import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const decks = await prisma.deck.findMany({
    where: {
      userId,
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
  });

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Study sets
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Study decks
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Group vocabulary by textbook, HSK focus, lesson, or personal
              theme.
            </p>
          </div>
          <Link
            href="/decks/new"
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Create deck
          </Link>
        </div>

        {decks.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="组"
              title="No active decks yet"
              actionHref="/decks/new"
              actionLabel="Create deck"
            >
              Create a deck to organize related vocabulary into a focused study
              set.
            </EmptyState>
          </div>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2">
            {decks.map((deck) => (
              <article
                key={deck.id}
                className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                        Study deck
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-950">
                        {deck.name}
                      </h2>
                    </div>
                    <span className="shrink-0 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
                      {deck._count.vocabularyItems} word
                      {deck._count.vocabularyItems === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-3 min-h-10 text-sm leading-6 text-slate-600">
                    {deck.description ?? "A focused place for related words."}
                  </p>
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
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
