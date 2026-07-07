"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  reviewCount: number;
};

const gradeLabels = {
  AGAIN: {
    label: "Forgot",
    helper: "Show me again soon",
    className: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
  },
  HARD: {
    label: "Hard",
    helper: "I remembered slowly",
    className: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  },
  GOOD: {
    label: "Got it",
    helper: "This felt right",
    className: "border-teal-200 bg-teal-50 text-teal-950 hover:bg-teal-100",
  },
  EASY: {
    label: "Easy",
    helper: "Very clear",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
  },
} as const;

export function DeckStudyCards({
  cards,
  deckId,
  deckName,
  dueOnly,
  canSaveProgress,
}: {
  cards: StudyCard[];
  deckId: string;
  deckName: string;
  dueOnly: boolean;
  canSaveProgress: boolean;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const currentCard = cards[currentIndex];

  const progressLabel = useMemo(
    () => `Card ${currentIndex + 1} of ${cards.length}`,
    [cards.length, currentIndex],
  );
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  function goToCard(index: number) {
    setCurrentIndex(index);
    setIsRevealed(false);
    setIsComplete(false);
  }

  if (!currentCard) {
    return null;
  }

  if (isComplete) {
    return (
      <section className="mt-8 rounded-md bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-100">
        <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-semibold text-teal-700 ring-1 ring-teal-100">
          学
        </p>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          Session complete
        </h2>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          You moved through {cards.length} card{cards.length === 1 ? "" : "s"}{" "}
          in {deckName}. Come back when you want another calm pass.
          {canSaveProgress ? null : " Sign in when you want future sessions to save your review timing."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={`/decks/${deckId}`}
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Back to deck
          </Link>
          <Link
            href={canSaveProgress ? "/review" : "/login"}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {canSaveProgress ? "Review due cards" : "Sign in to save progress"}
          </Link>
        </div>
      </section>
    );
  }

  const memoryItems = getMemoryItems(currentCard);
  const hasExample = Boolean(
    currentCard.exampleChinese ||
      currentCard.examplePinyin ||
      currentCard.exampleEnglish,
  );
  const isLastCard = currentIndex === cards.length - 1;

  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-100">
        <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-700">
                {progressLabel}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {dueOnly ? "Due cards" : "All cards"} in {deckName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <MetaChip label={deckName} tone="teal" />
              {currentCard.levelName ? (
                <MetaChip label={currentCard.levelName} />
              ) : null}
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-white px-5 py-8 text-center sm:px-8 sm:py-10">
          <p className="text-7xl font-semibold leading-none text-teal-700 sm:text-8xl">
            {currentCard.hanzi}
          </p>
          {!isRevealed ? (
            <div className="mx-auto mt-7 max-w-md">
              <p className="text-base leading-7 text-slate-600">
                Pause and recall the sound, meaning, and any memory story before
                checking the answer.
              </p>
              <button
                type="button"
                onClick={() => setIsRevealed(true)}
                className="mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                Reveal answer
              </button>
            </div>
          ) : (
            <div className="mx-auto mt-7 max-w-xl">
              <p className="text-2xl font-semibold text-slate-950">
                {formatPinyinForDisplay(currentCard.pinyin)}
              </p>
              <p className="mt-2 text-xl text-slate-700">
                {currentCard.meaning}
              </p>
            </div>
          )}
        </div>

        {isRevealed ? (
          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
            {hasExample ? (
              <section className="rounded-md bg-slate-50 p-4 ring-1 ring-slate-100 sm:p-5">
                <p className="text-sm font-semibold text-teal-700">
                  Example sentence
                </p>
                {currentCard.exampleChinese ? (
                  <p className="mt-2 text-xl font-semibold leading-8 text-slate-950">
                    <HighlightedChinese
                      text={currentCard.exampleChinese}
                      target={currentCard.hanzi}
                    />
                  </p>
                ) : null}
                {currentCard.examplePinyin ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatPinyinForDisplay(currentCard.examplePinyin)}
                  </p>
                ) : null}
                {currentCard.exampleEnglish ? (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {currentCard.exampleEnglish}
                  </p>
                ) : null}
              </section>
            ) : null}

            {memoryItems.length > 0 ? (
              <section className="rounded-md bg-white p-4 ring-1 ring-slate-100 sm:p-5">
                <p className="text-sm font-semibold text-teal-700">
                  How to remember
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {memoryItems.map((item) => (
                    <MemoryItem key={item.label} item={item} />
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Mnemonic aid, not guaranteed historical etymology.
                </p>
              </section>
            ) : null}

            <section>
              <p className="text-sm font-semibold text-slate-700">
                How did your memory feel?
              </p>
              {canSaveProgress ? (
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
              ) : (
                <div className="mt-3 rounded-md bg-teal-50 p-4 ring-1 ring-teal-100">
                  <p className="text-sm leading-6 text-teal-950">
                    Keep moving through the deck for practice. Sign in when you
                    want these ratings to update your review schedule.
                  </p>
                  <Link
                    href="/login"
                    className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                  >
                    Sign in to save progress
                  </Link>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => goToCard(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <p className="text-sm text-slate-500">
          Reviewed {currentCard.reviewCount} time
          {currentCard.reviewCount === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() =>
            isLastCard
              ? setIsComplete(true)
              : goToCard(Math.min(cards.length - 1, currentIndex + 1))
          }
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {isLastCard ? "Finish session" : "Next card"}
        </button>
      </div>
    </section>
  );
}

type MemoryItem = {
  label: string;
  value: string;
  warm?: boolean;
};

function MemoryItem({ item }: { item: MemoryItem }) {
  return (
    <div
      className={
        item.warm
          ? "rounded-md bg-amber-50 p-3 ring-1 ring-amber-100"
          : "rounded-md bg-slate-50 p-3 ring-1 ring-slate-100"
      }
    >
      <p
        className={
          item.warm
            ? "text-sm font-semibold text-amber-900"
            : "text-sm font-semibold text-slate-700"
        }
      >
        {item.label}
      </p>
      <p
        className={
          item.warm
            ? "mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-950"
            : "mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700"
        }
      >
        {item.value}
      </p>
    </div>
  );
}

function MetaChip({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "teal" | "slate";
}) {
  const toneClass =
    tone === "teal"
      ? "bg-teal-50 text-teal-800 ring-teal-100"
      : "bg-slate-50 text-slate-600 ring-slate-100";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${toneClass}`}
    >
      {label}
    </span>
  );
}

function HighlightedChinese({
  text,
  target,
}: {
  text: string;
  target: string;
}) {
  if (!target || !text.includes(target)) {
    return <>{text}</>;
  }

  const parts = text.split(target);

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? (
            <mark className="rounded bg-teal-50 px-1 text-teal-800">
              {target}
            </mark>
          ) : null}
        </span>
      ))}
    </>
  );
}

function getMemoryItems(card: StudyCard) {
  const items: MemoryItem[] = [];
  const seen = new Set<string>();

  const addItem = (label: string, value: string | null, warm = false) => {
    if (!value?.trim()) {
      return;
    }

    const cleanedValue = cleanMemoryText(value);
    const normalizedValue = normalizeMemoryText(cleanedValue);

    if (!cleanedValue || seen.has(normalizedValue)) {
      return;
    }

    seen.add(normalizedValue);
    items.push({ label, value: cleanedValue, warm });
  };

  addItem("Character formula", card.characterBreakdown);
  addItem("Component meanings", card.wordFormationNote);
  addItem("Memory story", card.memoryMnemonic, true);

  for (const note of card.characterNotes.slice(0, 2)) {
    addItem(`${note.character} formula`, note.components);
    addItem(`${note.character} clue`, note.componentMeanings);
    addItem(`${note.character} story`, note.mnemonicStory, true);
  }

  return items.slice(0, 4);
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

function normalizeMemoryText(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}
