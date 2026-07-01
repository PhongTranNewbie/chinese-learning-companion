import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckStudyCards } from "@/components/deck-study-cards";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type DeckStudyPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    mode?: string;
  }>;
};

export default async function DeckStudyPage({
  params,
  searchParams,
}: DeckStudyPageProps) {
  const { id } = await params;
  const { mode } = await searchParams;
  const dueOnly = mode === "due";
  const now = new Date();

  const deck = await prisma.deck.findFirst({
    where: {
      id,
      isArchived: false,
    },
    include: {
      vocabularyItems: {
        where: {
          isArchived: false,
          reviewCard: dueOnly
            ? {
                status: "ACTIVE",
                dueAt: {
                  lte: now,
                },
              }
            : {
                status: "ACTIVE",
              },
        },
        include: {
          reviewCard: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!deck) {
    notFound();
  }

  const cards = deck.vocabularyItems
    .filter((item) => item.reviewCard)
    .map((item) => ({
      id: item.id,
      reviewCardId: item.reviewCard!.id,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaning: item.meaning,
      exampleChinese: item.exampleChinese,
      examplePinyin: item.examplePinyin,
      exampleEnglish: item.exampleEnglish,
      characterBreakdown: item.characterBreakdown,
      wordFormationNote: item.wordFormationNote,
      memoryMnemonic: item.memoryMnemonic,
      dueAt: item.reviewCard!.dueAt.toISOString(),
      reviewCount: item.reviewCard!.reviewCount,
    }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`/decks/${deck.id}`} className="text-sm font-medium text-red-700">
            Back to deck
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Study {deck.name}
          </h1>
          <p className="mt-2 text-slate-600">
            {dueOnly
              ? "Review due cards from this deck."
              : "Study all active vocabulary from this deck."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/decks/${deck.id}/study`}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              dueOnly
                ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                : "bg-slate-950 text-white"
            }`}
          >
            All cards
          </Link>
          <Link
            href={`/decks/${deck.id}/study?mode=due`}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              dueOnly
                ? "bg-slate-950 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Due only
          </Link>
        </div>
      </div>

      {cards.length === 0 ? (
        <section className="mt-10 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            {dueOnly ? "No due cards in this deck" : "No active vocabulary in this deck"}
          </h2>
          <p className="mt-2 text-slate-600">
            {dueOnly
              ? "Switch to all cards or come back when this deck has reviews due."
              : "Add or import vocabulary before starting study mode."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {dueOnly ? (
              <Link
                href={`/decks/${deck.id}/study`}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Study all cards
              </Link>
            ) : null}
            <Link
              href={`/vocabulary/new?deckId=${deck.id}`}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
            >
              Add vocabulary
            </Link>
          </div>
        </section>
      ) : (
        <DeckStudyCards cards={cards} deckId={deck.id} />
      )}
    </main>
  );
}
