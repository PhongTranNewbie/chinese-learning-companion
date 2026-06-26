import Link from "next/link";
import { submitReview } from "@/lib/review";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const gradeLabels = {
  AGAIN: "Again",
  HARD: "Hard",
  GOOD: "Good",
  EASY: "Easy",
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
          level: true,
        },
      },
    },
    orderBy: {
      dueAt: "asc",
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-red-700">
            Review
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Due cards
          </h1>
          <p className="mt-2 text-slate-600">
            {dueCards.length} card{dueCards.length === 1 ? "" : "s"} due now.
          </p>
        </div>
        <Link
          href="/vocabulary/new"
          className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
        >
          Add vocabulary
        </Link>
      </div>

      {dueCards.length === 0 ? (
        <section className="mt-10 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No reviews due
          </h2>
          <p className="mt-2 text-slate-600">
            New vocabulary appears here when its review card is due.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/vocabulary/new"
              className="inline-flex rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
            >
              Add vocabulary
            </Link>
            <Link
              href="/vocabulary"
              className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View vocabulary
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 space-y-4">
          {dueCards.map((card) => (
            <article
              key={card.id}
              className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {card.vocabularyItem.level?.name ?? "No level"}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                    {card.vocabularyItem.hanzi}
                  </h2>
                  <p className="mt-2 text-lg text-slate-700">
                    {card.vocabularyItem.pinyin} / {card.vocabularyItem.meaning}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Due {formatDateTime(card.dueAt)} / Reviewed{" "}
                    {card.reviewCount} time{card.reviewCount === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-4 lg:min-w-[380px]">
                  {Object.entries(gradeLabels).map(([grade, label]) => (
                    <form key={grade} action={submitReview}>
                      <input
                        type="hidden"
                        name="reviewCardId"
                        value={card.id}
                      />
                      <input type="hidden" name="grade" value={grade} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
