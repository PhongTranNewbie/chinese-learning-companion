import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckStudyCards } from "@/components/deck-study-cards";
import { EmptyState } from "@/components/empty-state";
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
          <div className="mt-8">
            <EmptyState
              icon="学"
              title={dueOnly ? "This deck is caught up" : "This deck is ready for words"}
              actionHref={dueOnly ? `/decks/${deck.id}/study` : `/vocabulary/new?deckId=${deck.id}`}
              actionLabel={dueOnly ? "Study all cards" : "Add vocabulary"}
              secondaryHref={dueOnly ? `/vocabulary/new?deckId=${deck.id}` : undefined}
              secondaryLabel={dueOnly ? "Add vocabulary" : undefined}
            >
              {dueOnly
                ? "No cards are due right now. Study all cards if you want extra practice, or come back later."
                : "Add or import vocabulary before starting a focused study session."}
            </EmptyState>
          </div>
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
