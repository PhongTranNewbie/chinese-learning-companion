import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckStudyCards } from "@/components/deck-study-cards";
import { EmptyState } from "@/components/empty-state";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getStudyPreferences } from "@/lib/study-preferences";

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
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const preferences = await getStudyPreferences(userId);
  const { id } = await params;
  const { mode } = await searchParams;
  const dueOnly = mode === "due";
  const now = new Date();

  const deck = await prisma.deck.findFirst({
    where: {
      id,
      userId,
      isArchived: false,
    },
  });

  if (!deck) {
    notFound();
  }

  const isPublicDeck = deck.userId === null;

  // A starter/template deck has no per-user cards - template cards were removed
  // in Phase 5, and a card can only hang off a user's join row - so studying one
  // requires copying it first. Guests and users who have not copied it see the
  // copy prompt instead of cards. An owned deck is studied through the
  // signed-in user's join rows.
  const cards =
    !isPublicDeck && user
      ? await getOwnedStudyCards(
          user.id,
          deck.id,
          dueOnly,
          now,
          preferences.deckStudySessionSize,
        )
      : [];

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-6 sm:py-8">
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
                ? "Move through the due cards in this deck one calm recall at a time."
                : "Study this deck at your own pace. Recall first, then reveal the answer."}
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
              title={
                isPublicDeck
                  ? "Copy this starter deck to study it"
                  : dueOnly
                    ? "This deck is caught up"
                    : "This deck is ready for words"
              }
              actionHref={
                isPublicDeck
                  ? `/decks/${deck.id}`
                  : dueOnly
                    ? `/decks/${deck.id}/study`
                    : `/decks/${deck.id}`
              }
              actionLabel={
                isPublicDeck
                  ? "Back to deck"
                  : dueOnly
                    ? "Study all cards"
                    : "Back to deck"
              }
              secondaryHref={
                isPublicDeck
                  ? user
                    ? `/decks/${deck.id}`
                    : "/login"
                  : dueOnly
                    ? `/decks/${deck.id}`
                    : user
                      ? `/vocabulary/new?deckId=${deck.id}`
                      : "/login"
              }
              secondaryLabel={
                isPublicDeck
                  ? user
                    ? "Copy this deck"
                    : "Log in to copy"
                  : dueOnly
                    ? "Back to deck"
                    : user
                      ? "Add vocabulary"
                      : "Log in to add"
              }
            >
              {isPublicDeck
                ? "Copy this starter deck into your library to start building review progress."
                : dueOnly
                  ? "No cards are due right now. Study all cards if you want extra practice, or come back later."
                  : "Add or import vocabulary when you are ready to build this study set."}
            </EmptyState>
          </div>
        ) : (
          <DeckStudyCards
            cards={cards}
            deckId={deck.id}
            deckName={deck.name}
            dueOnly={dueOnly}
            canSaveProgress={Boolean(user)}
            showMemoryAid={preferences.showMemoryAidOnReveal}
          />
        )}
      </div>
    </main>
  );
}

/**
 * Study an owned deck through the signed-in user's join rows for it. Catalog
 * scalars come from the join's catalog entry; the per-user mnemonic, meaning
 * and review card come from the join itself. Card ids are the join's card ids,
 * and word ids are the catalog entry ids.
 */
async function getOwnedStudyCards(
  userId: string,
  deckId: string,
  dueOnly: boolean,
  now: Date,
  take: number,
) {
  const userVocabularies = await prisma.userVocabulary.findMany({
    where: {
      userId,
      deckId,
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
      vocabularyItem: {
        include: {
          level: true,
          characterNotes: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take,
  });

  return userVocabularies.map((uv) => ({
    id: uv.vocabularyItem.id,
    reviewCardId: uv.reviewCard!.id,
    hanzi: uv.vocabularyItem.hanzi,
    pinyin: uv.vocabularyItem.pinyin,
    meaning: uv.personalMeaning ?? uv.vocabularyItem.meaning,
    levelName: uv.vocabularyItem.level?.name ?? null,
    exampleChinese: uv.vocabularyItem.exampleChinese,
    examplePinyin: uv.vocabularyItem.examplePinyin,
    exampleEnglish: uv.vocabularyItem.exampleEnglish,
    characterBreakdown: uv.vocabularyItem.characterBreakdown,
    wordFormationNote: uv.vocabularyItem.wordFormationNote,
    memoryMnemonic: uv.memoryMnemonic,
    characterNotes: uv.vocabularyItem.characterNotes.map((note) => ({
      id: note.id,
      character: note.character,
      components: note.components,
      componentMeanings: note.componentMeanings,
      mnemonicStory: note.mnemonicStory,
    })),
    reviewCount: uv.reviewCard!.reviewCount,
  }));
}
