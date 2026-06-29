import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DecksPage() {
  const decks = await prisma.deck.findMany({
    where: {
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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-red-700">
            Decks
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Study decks
          </h1>
          <p className="mt-2 text-slate-600">
            Group vocabulary by textbook, HSK focus, lesson, or personal theme.
          </p>
        </div>
        <Link
          href="/decks/new"
          className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
        >
          Create deck
        </Link>
      </div>

      {decks.length === 0 ? (
        <section className="mt-10 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No active decks yet
          </h2>
          <p className="mt-2 text-slate-600">
            Create a deck to organize related vocabulary.
          </p>
          <Link
            href="/decks/new"
            className="mt-5 inline-flex rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
          >
            Create deck
          </Link>
        </section>
      ) : (
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {decks.map((deck) => (
            <article
              key={deck.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {deck.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {deck.description ?? "No description yet."}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    {deck._count.vocabularyItems} active word
                    {deck._count.vocabularyItems === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  href={`/decks/${deck.id}`}
                  className="shrink-0 text-sm font-semibold text-red-700 hover:text-red-800"
                >
                  Open
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
