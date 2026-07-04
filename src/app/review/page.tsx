import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { submitReview } from "@/lib/review";
import { prisma } from "@/lib/db";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";

export const dynamic = "force-dynamic";

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

export default async function ReviewPage() {
  const now = new Date();
  const dueCards = await prisma.reviewCard.findMany({
    where: {
      status: "ACTIVE",
      dueAt: {
        lte: now,
      },
      vocabularyItem: {
        isArchived: false,
      },
    },
    include: {
      vocabularyItem: {
        include: {
          deck: true,
          level: true,
        },
      },
    },
    orderBy: {
      dueAt: "asc",
    },
  });

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Study session
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Review due cards
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Focus on one word at a time. Choose the answer that best matches
              how it felt to remember.
            </p>
          </div>
          <Link
            href="/vocabulary/new"
            className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          >
            Add vocabulary
          </Link>
        </div>

      {dueCards.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="好"
            title="You are caught up"
            actionHref="/vocabulary/new"
            actionLabel="Add vocabulary"
            secondaryHref="/vocabulary"
            secondaryLabel="View vocabulary"
          >
            No cards are due right now. Add a new word or browse your vocabulary
            when you are ready for more practice.
          </EmptyState>
        </div>
      ) : (
        <section className="mt-8 space-y-5">
          <div className="rounded-md bg-white px-4 py-3 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
            {dueCards.length} card{dueCards.length === 1 ? "" : "s"} ready for
            review.
          </div>
          {dueCards.map((card) => (
            <article
              key={card.id}
              className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-center">
                <div className="text-center lg:text-left">
                  <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                    {card.vocabularyItem.deck ? (
                      <MetaChip label={card.vocabularyItem.deck.name} />
                    ) : null}
                    {card.vocabularyItem.level ? (
                      <MetaChip label={card.vocabularyItem.level.name} />
                    ) : null}
                  </div>
                  <h2 className="mt-5 rounded-md bg-teal-50 px-5 py-8 text-center text-6xl font-semibold leading-none text-teal-700 ring-1 ring-teal-100 sm:text-7xl">
                    {card.vocabularyItem.hanzi}
                  </h2>
                  <p className="mt-4 text-2xl font-semibold text-slate-950">
                    {formatPinyinForDisplay(card.vocabularyItem.pinyin)}
                  </p>
                  <p className="mt-1 text-xl text-slate-700">
                    {card.vocabularyItem.meaning}
                  </p>
                  <p className="mt-4 text-sm text-slate-500">
                    Reviewed {card.reviewCount} time
                    {card.reviewCount === 1 ? "" : "s"} / due{" "}
                    {formatDateTime(card.dueAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    How did it feel?
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {Object.entries(gradeLabels).map(([grade, gradeMeta]) => (
                      <form key={grade} action={submitReview}>
                        <input
                          type="hidden"
                          name="reviewCardId"
                          value={card.id}
                        />
                        <input type="hidden" name="grade" value={grade} />
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
              </div>
            </article>
          ))}
        </section>
      )}
      </div>
    </main>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-100">
      {label}
    </span>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
