import Link from "next/link";
import { notFound } from "next/navigation";
import { shouldShowDeckStudyActions } from "@/lib/archive-rules";
import { archiveDeck } from "@/lib/decks";
import { prisma } from "@/lib/db";

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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/decks" className="text-sm font-medium text-red-700">
            Back to decks
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {deck.name}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {deck.description ?? "No description yet."}
          </p>
          {deck.isArchived ? (
            <p className="mt-3 inline-flex rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Archived
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {showStudyActions ? (
            <>
              <Link
                href={`/decks/${deck.id}/study`}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
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
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Archive
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {deck.vocabularyItems.length === 0 ? (
        <section className="mt-10 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No active vocabulary in this deck
          </h2>
          <p className="mt-2 text-slate-600">
            {deck.isArchived
              ? "This archived deck has no active vocabulary."
              : "Add or import words to start studying this deck."}
          </p>
        </section>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Hanzi</th>
                <th className="px-4 py-3 font-semibold">Pinyin</th>
                <th className="px-4 py-3 font-semibold">Meaning</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {deck.vocabularyItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {item.hanzi}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.pinyin}</td>
                  <td className="px-4 py-3 text-slate-700">{item.meaning}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.level?.name ?? "None"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.reviewCard?.dueAt.toLocaleDateString() ?? "Missing"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/vocabulary/${item.id}`}
                      className="font-medium text-red-700 hover:text-red-800"
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
    </main>
  );
}
