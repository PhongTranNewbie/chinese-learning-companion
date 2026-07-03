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
          level: true,
          characterNotes: {
            orderBy: {
              sortOrder: "asc",
            },
          },
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
      levelName: item.level?.name ?? null,
      exampleChinese: item.exampleChinese,
      examplePinyin: item.examplePinyin,
      exampleEnglish: item.exampleEnglish,
      characterBreakdown: item.characterBreakdown,
      wordFormationNote: item.wordFormationNote,
      memoryMnemonic: item.memoryMnemonic,
      characterNotes: item.characterNotes.map((note) => ({
        id: note.id,
        character: note.character,
        components: note.components,
        componentMeanings: note.componentMeanings,
        mnemonicStory: note.mnemonicStory,
      })),
      dueAt: item.reviewCard!.dueAt.toISOString(),
      reviewCount: item.reviewCard!.reviewCount,
    }));

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href={`/decks/${deck.id}`}
              className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
            >
              Back to deck
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Study {deck.name}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              {dueOnly
                ? "Review the cards in this deck that are ready today."
                : "Move through this deck at your own pace, then reveal each answer when you are ready."}
            </p>
          </div>
          <div className="flex rounded-md bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <Link
              href={`/decks/${deck.id}/study`}
              className={`rounded px-4 py-2 text-sm font-semibold transition ${
                dueOnly
                  ? "text-slate-600 hover:bg-slate-50"
                  : "bg-teal-700 text-white shadow-sm"
              }`}
            >
              All cards
            </Link>
            <Link
              href={`/decks/${deck.id}/study?mode=due`}
              className={`rounded px-4 py-2 text-sm font-semibold transition ${
                dueOnly
                  ? "bg-teal-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Due only
            </Link>
          </div>
        </div>

        {cards.length === 0 ? (
          <section className="mt-8 rounded-md bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-100">
            <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-semibold text-teal-700 ring-1 ring-teal-100">
              学
            </p>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              {dueOnly
                ? "This deck is caught up"
                : "This deck is ready for words"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              {dueOnly
                ? "No cards are due right now. Study all cards if you want extra practice, or come back later."
                : "Add or import vocabulary before starting a focused study session."}
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
                className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Add vocabulary
              </Link>
            </div>
          </section>
        ) : (
          <DeckStudyCards
            cards={cards}
            deckId={deck.id}
            deckName={deck.name}
            dueOnly={dueOnly}
          />
        )}
      </div>
    </main>
  );
}
