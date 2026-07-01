"use client";

import { useMemo, useState } from "react";
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

  return (
    <section className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-500">{progressLabel}</p>
        <p className="text-sm text-slate-500">
          Due {new Date(currentCard.dueAt).toLocaleDateString()} / reviewed{" "}
          {currentCard.reviewCount} time
          {currentCard.reviewCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="py-12 text-center">
        <p className="text-6xl font-semibold text-slate-950">
          {currentCard.hanzi}
        </p>

        {isRevealed ? (
          <div className="mx-auto mt-8 max-w-2xl space-y-3 text-left">
            <p className="text-lg text-slate-700">
              <span className="font-semibold text-slate-950">Pinyin:</span>{" "}
              {currentCard.pinyin}
            </p>
            <p className="text-lg text-slate-700">
              <span className="font-semibold text-slate-950">Meaning:</span>{" "}
              {currentCard.meaning}
            </p>
            {currentCard.exampleChinese ||
            currentCard.examplePinyin ||
            currentCard.exampleEnglish ? (
              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Example</p>
                {currentCard.exampleChinese ? (
                  <p className="mt-2 text-slate-950">
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
            {currentCard.characterBreakdown ||
            currentCard.wordFormationNote ||
            currentCard.memoryMnemonic ? (
              <div className="rounded-md border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-500">
                  Hanzi memory notes
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Memory aids, not guaranteed historical etymology.
                </p>
                {currentCard.characterBreakdown ? (
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
          </div>
        ) : (
          <p className="mt-8 text-slate-600">
            Reveal the answer when you are ready.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-200 pt-5">
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
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
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
    <div className="mt-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{value}</p>
    </div>
  );
}
