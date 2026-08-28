import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ReviewSessionCards } from "@/components/review-session-cards";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { getStudyPreferences } from "@/lib/study-preferences";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const preferences = await getStudyPreferences(userId);
  const now = new Date();
  // The queue is scoped through the signed-in user's join rows: catalog data
  // comes from the join's catalog entry and per-user data from the join itself.
  // Guests have no join rows (the "" sentinel matches none), consistent with the
  // vocabulary list.
  const dueCards = await prisma.reviewCard.findMany({
    where: {
      status: "ACTIVE",
      dueAt: {
        lte: now,
      },
      userVocabulary: {
        userId: userId ?? "",
        isArchived: false,
      },
    },
    include: {
      userVocabulary: {
        include: {
          deck: true,
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
      },
    },
    orderBy: {
      dueAt: "asc",
    },
    take: preferences.reviewSessionSize,
  });
  const cards = dueCards.map((card) => {
    const uv = card.userVocabulary!;
    return {
      id: card.id,
      hanzi: uv.vocabularyItem.hanzi,
      pinyin: uv.vocabularyItem.pinyin,
      meaning: uv.personalMeaning ?? uv.vocabularyItem.meaning,
      deckName: uv.deck?.name ?? null,
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
      reviewCount: card.reviewCount,
    };
  });

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Study session
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Review due cards
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Focus on one word at a time. Recall first, reveal the answer,
              then rate how it felt.
            </p>
          </div>
          <Link
            href={user ? "/vocabulary/new" : "/login"}
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            {user ? "Add vocabulary" : "Log in to save"}
          </Link>
        </div>

        {cards.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon="好"
              title="You are caught up"
              actionHref="/vocabulary"
              actionLabel="View vocabulary"
              secondaryHref="/decks"
              secondaryLabel="Study decks"
            >
              No cards are due right now. Take the win, or browse your words
              when you are ready for a little extra practice.
            </EmptyState>
          </div>
        ) : (
          <ReviewSessionCards
            cards={cards}
            canSaveProgress={Boolean(user)}
            showMemoryAid={preferences.showMemoryAidOnReveal}
          />
        )}
      </div>
    </main>
  );
}