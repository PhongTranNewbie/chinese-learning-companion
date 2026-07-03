"use client";

import { useMemo, useState } from "react";
import { CharacterNotesDisplay } from "@/components/character-notes-display";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";
import { submitReview } from "@/lib/review";

type StudyCard = {
  id: string;
  reviewCardId: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  levelName: string | null;
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
  AGAIN: {
    label: "Again",
    helper: "Still learning",
    className: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  },
  HARD: {
    label: "Hard",
    helper: "I remembered slowly",
    className: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
  GOOD: {
    label: "Good",
    helper: "I knew it",
    className: "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100",
  },
  EASY: {
    label: "Easy",
    helper: "Very clear",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  },
} as const;

export function DeckStudyCards({
  cards,
  deckId,
  deckName,
  dueOnly,
}: {
  cards: StudyCard[];
  deckId: string;
  deckName: string;
  dueOnly: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const currentCard = cards[currentIndex];

  const progressLabel = useMemo(
    () => `${currentIndex + 1} of ${cards.length}`,
    [cards.length, currentIndex],
  );
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  function goToCard(index: number) {
    setCurrentIndex(index);
    setIsRevealed(false);
  }

  if (!currentCard) {
    return null;
  }

  const hasCharacterStories = currentCard.characterNotes.length > 0;
  const wordFormationNote = currentCard.wordFormationNote?.trim() ?? "";
  const memoryMnemonic = currentCard.memoryMnemonic
    ? cleanMemoryText(currentCard.memoryMnemonic)
    : "";
  const hasWordLevelMemoryNotes = Boolean(
    wordFormationNote ||
      memoryMnemonic ||
      (!hasCharacterStories && currentCard.characterBreakdown),
  );

  return (
    <section className="mt-8">
      <div className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Flashcard study
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {progressLabel} / {dueOnly ? "due only" : "all cards"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MetaChip label={deckName} />
            {currentCard.levelName ? (
              <MetaChip label={currentCard.levelName} />
            ) : null}
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-teal-600"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-6 text-center">
          <div className="mx-auto max-w-xl rounded-md bg-teal-50 px-5 py-10 ring-1 ring-teal-100 sm:px-8 sm:py-12">
            <p className="text-7xl font-semibold leading-none text-teal-700 sm:text-8xl">
              {currentCard.hanzi}
            </p>
            {!isRevealed ? (
              <p className="mx-auto mt-6 max-w-sm text-slate-600">
                Take a moment to recall the sound and meaning, then reveal the
                answer.
              </p>
            ) : null}
          </div>

          {isRevealed ? (
            <div className="mx-auto mt-8 max-w-3xl space-y-5 text-left">
              <div className="text-center">
                <p className="text-2xl font-semibold text-slate-950">
                  {formatPinyinForDisplay(currentCard.pinyin)}
                </p>
                <p className="mt-2 text-xl text-slate-700">
                  {currentCard.meaning}
                </p>
                <p className="mt-3 text-sm text-slate-500">
                  Next review: {formatDate(currentCard.dueAt)} / reviewed{" "}
                  {currentCard.reviewCount} time
                  {currentCard.reviewCount === 1 ? "" : "s"}
                </p>
              </div>
              {currentCard.exampleChinese ||
              currentCard.examplePinyin ||
              currentCard.exampleEnglish ? (
                <div className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-100 sm:p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Example
                  </p>
                  {currentCard.exampleChinese ? (
                    <p className="mt-2 text-xl font-semibold text-slate-950">
                      {currentCard.exampleChinese}
                    </p>
                  ) : null}
                  {currentCard.examplePinyin ? (
                    <p className="mt-1 text-slate-600">
                      {formatPinyinForDisplay(currentCard.examplePinyin)}
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
                <div className="rounded-md bg-white p-4 ring-1 ring-slate-100 sm:p-5">
                  <p className="text-sm font-semibold text-teal-700">
                    How to remember this word
                  </p>
                  {!hasCharacterStories && currentCard.characterBreakdown ? (
                    <MemoryNote
                      label="Character breakdown"
                      value={currentCard.characterBreakdown}
                    />
                  ) : null}
                  {wordFormationNote ? (
                    <MemoryNote
                      label="How it fits together"
                      value={wordFormationNote}
                    />
                  ) : null}
                  {memoryMnemonic ? (
                    <MemoryNote label="Picture it" value={memoryMnemonic} />
                  ) : null}
                </div>
              ) : null}
              <CharacterNotesDisplay
                notes={currentCard.characterNotes}
                className="text-left"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {isRevealed ? (
            <div>
              <p className="text-sm font-semibold text-slate-700">
                How did it feel?
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(gradeLabels).map(([grade, gradeMeta]) => (
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
                      className={`min-h-20 w-full rounded-md border px-4 py-3 text-left transition hover:-translate-y-0.5 ${gradeMeta.className}`}
                    >
                      <span className="block text-base font-semibold">
                        {gradeMeta.label}
                      </span>
                      <span className="mt-1 block text-sm opacity-80">
                        {gradeMeta.helper}
                      </span>
                    </button>
                  </form>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsRevealed(true)}
              className="mx-auto inline-flex rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
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
      </div>
    </section>
  );
}

function MemoryNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 rounded-md bg-amber-50 p-3 ring-1 ring-amber-100">
      <p className="text-sm font-semibold text-amber-900">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-950">
        {value}
      </p>
    </div>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
      {label}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function cleanMemoryText(value: string) {
  return value
    .replace(/^(updated\s+)?memory (aid|story):\s*/i, "")
    .replace(/\s*[.;]\s*this is (a )?[^.]*mnemonic[^.]*\./gi, "")
    .replace(/\s*[.;]\s*this is (a )?[^.]*origin[^.]*\./gi, "")
    .replace(/\s*[.;,]\s*mnemonic only[^.]*\./gi, "")
    .replace(/\s*[.;,]\s*not (a )?(true )?origin[^.]*\./gi, "")
    .trim();
}
