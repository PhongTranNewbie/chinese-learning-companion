"use client";

import { useMemo, useState } from "react";
import { CharacterNotesDisplay } from "@/components/character-notes-display";
import { submitReview } from "@/lib/review";

type StudyCard = {
  id: string;
  reviewCardId: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  exampleChinese: string | null;
  examplePinyin: string | null;
  exampleEnglish: string | null;
  characterBreakdown: string | null;
  wordFormationNote: string | null;
  memoryMnemonic: string | null;
  characterNotes: {
    id: string;
    character: string;
    components: string | null;
    componentMeanings: string | null;
    mnemonicStory: string | null;
  }[];
  dueAt: string;
  reviewCount: number;
};

const gradeLabels = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
} as const;

export function DeckStudyCards({
  cards,
  deckId,
}: {
  cards: StudyCard[];
  deckId: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const currentCard = cards[currentIndex];

  const progressLabel = useMemo(
    () => `${currentIndex + 1} of ${cards.length}`,
    [cards.length, currentIndex],
  );

  function goToCard(index: number) {
    setCurrentIndex(index);
    setIsRevealed(false);
  }

  if (!currentCard) {
    return null;
  }

  const hasCharacterStories = currentCard.characterNotes.length > 0;
  const hasWordLevelMemoryNotes = Boolean(
    currentCard.wordFormationNote ||
      currentCard.memoryMnemonic ||
      (!hasCharacterStories && currentCard.characterBreakdown),
  );

  return (
    <section className="mt-8 rounded-md bg-teal-50/40 p-4 shadow-sm ring-1 ring-teal-100 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500">{progressLabel}</p>
        <p className="text-sm text-slate-500">
          Due {new Date(currentCard.dueAt).toLocaleDateString()} / reviewed{" "}
          {currentCard.reviewCount} time
          {currentCard.reviewCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-5 rounded-md bg-white px-4 py-10 text-center shadow-sm ring-1 ring-red-100 sm:px-6 sm:py-12">
        <p className="mx-auto flex min-h-28 w-full max-w-xs items-center justify-center rounded-md bg-teal-50 px-6 py-8 text-7xl font-semibold leading-none text-teal-700 ring-1 ring-teal-100">
          {currentCard.hanzi}
        </p>

        {isRevealed ? (
          <div className="mx-auto mt-8 max-w-3xl space-y-5 text-left">
            <div className="text-center">
              <p className="text-2xl font-semibold text-slate-950">
                {currentCard.pinyin}
              </p>
              <p className="mt-2 text-xl text-slate-700">
                {currentCard.meaning}
              </p>
            </div>
            {currentCard.exampleChinese ||
            currentCard.examplePinyin ||
            currentCard.exampleEnglish ? (
              <div className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-500">Example</p>
                {currentCard.exampleChinese ? (
                  <p className="mt-2 text-xl font-semibold text-slate-950">
                    {currentCard.exampleChinese}
                  </p>
                ) : null}
                {currentCard.examplePinyin ? (
                  <p className="mt-1 text-slate-600">
                    {currentCard.examplePinyin}
                  </p>
                ) : null}
                {currentCard.exampleEnglish ? (
                  <p className="mt-1 text-slate-600">
                    {currentCard.exampleEnglish}
                  </p>
                ) : null}
              </div>
            ) : null}
            {hasWordLevelMemoryNotes ? (
              <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-teal-700">
                  How to remember this word
                </p>
                {!hasCharacterStories && currentCard.characterBreakdown ? (
                  <MemoryNote
                    label="Character breakdown"
                    value={currentCard.characterBreakdown}
                  />
                ) : null}
                {currentCard.wordFormationNote ? (
                  <MemoryNote
                    label="Word formation"
                    value={currentCard.wordFormationNote}
                  />
                ) : null}
                {currentCard.memoryMnemonic ? (
                  <MemoryNote
                    label="Mnemonic"
                    value={currentCard.memoryMnemonic}
                  />
                ) : null}
              </div>
            ) : null}
            <CharacterNotesDisplay notes={currentCard.characterNotes} />
          </div>
        ) : (
          <p className="mt-8 text-slate-600">
            Reveal the answer when you are ready.
          </p>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {isRevealed ? (
          <div className="grid gap-2 sm:grid-cols-4">
            {Object.entries(gradeLabels).map(([grade, label]) => (
              <form key={grade} action={submitReview}>
                <input
                  type="hidden"
                  name="reviewCardId"
                  value={currentCard.reviewCardId}
                />
                <input type="hidden" name="grade" value={grade} />
                <input type="hidden" name="deckId" value={deckId} />
                <button
                  type="submit"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {label}
                </button>
              </form>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsRevealed(true)}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Reveal answer
          </button>
        )}

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => goToCard(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() =>
              goToCard(Math.min(cards.length - 1, currentIndex + 1))
            }
            disabled={currentIndex === cards.length - 1}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

function MemoryNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-md bg-teal-50 p-3 ring-1 ring-teal-100">
      <p className="text-sm font-semibold text-teal-950">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-teal-900">
        {value}
      </p>
    </div>
  );
}
