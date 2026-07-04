import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getDashboardData();
  const hasVocabulary = dashboard.activeVocabularyCount > 0;
  const hasDueReviews = dashboard.dueReviewCount > 0;

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
      <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              Learning home
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {hasDueReviews
                ? "Your next review is ready"
                : hasVocabulary
                  ? "Keep your Chinese moving"
                  : "Start your Chinese library"}
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              {hasDueReviews
                ? `${dashboard.dueReviewCount} card${
                    dashboard.dueReviewCount === 1 ? " is" : "s are"
                  } due now. A short review session is the best next step.`
                : hasVocabulary
                  ? "No cards are due right now. Browse your vocabulary, study a deck, or add the next word you want to remember."
                  : "Add your first Mandarin word to create a review card and begin building a study rhythm."}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {hasDueReviews ? (
                <Link
                  href="/review"
                  className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                >
                  Review due cards
                </Link>
              ) : null}
              <Link
                href={hasVocabulary ? "/vocabulary" : "/vocabulary/new"}
                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  hasDueReviews
                    ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    : "bg-teal-700 text-white hover:bg-teal-800"
                }`}
              >
                {hasVocabulary ? "View vocabulary" : "Add vocabulary"}
              </Link>
              <Link
                href="/vocabulary/new"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Add word
              </Link>
            </div>
          </div>
          <div className="rounded-md bg-teal-50 p-5 ring-1 ring-teal-100">
            <p className="text-sm font-semibold text-teal-800">
              Today&apos;s rhythm
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniStat
                label="Due now"
                value={dashboard.dueReviewCount}
                tone="teal"
              />
              <MiniStat
                label="Done today"
                value={dashboard.reviewsCompletedToday}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-teal-900">
              {hasDueReviews
                ? "Review first, then add or study new words if you still have energy."
                : "You are caught up for now. A little extra study can keep the habit warm."}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Words you are learning"
          value={dashboard.activeVocabularyCount}
          helper="Active vocabulary"
          tone="teal"
        />
        <SummaryCard
          label="Ready to review"
          value={dashboard.dueReviewCount}
          helper="Due cards now"
        />
        <SummaryCard
          label="Today&apos;s practice"
          value={dashboard.reviewsCompletedToday}
          helper="Reviews completed"
        />
        <SummaryCard
          label="Set aside"
          value={dashboard.archivedVocabularyCount}
          helper="Archived words"
        />
      </section>

      {dashboard.activeVocabularyCount === 0 ? (
        <section className="mt-8 rounded-md bg-white px-6 py-12 text-center shadow-sm ring-1 ring-slate-100">
          <p className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-2xl font-semibold text-teal-700 ring-1 ring-teal-100">
            学
          </p>
          <h2 className="mt-5 text-xl font-semibold text-slate-950">
            No active vocabulary yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-slate-600">
            Add your first Mandarin word to create its review card and give this
            dashboard something useful to guide.
          </p>
          <div className="mt-5">
            <Link
              href="/vocabulary/new"
              className="inline-flex items-center justify-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
            >
              Add vocabulary
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Recent practice"
          eyebrow="What you just studied"
        >
          {dashboard.recentReviewEvents.length === 0 ? (
            <EmptyPanelText
              actionHref="/review"
              actionLabel="Go to review"
            >
              Review history will appear here after you grade due cards.
            </EmptyPanelText>
          ) : (
            <ul className="divide-y divide-slate-200">
              {dashboard.recentReviewEvents.map((event) => (
                <li key={event.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-teal-700">
                        {event.reviewCard.vocabularyItem.hanzi}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatPinyinForDisplay(
                          event.reviewCard.vocabularyItem.pinyin,
                        )}{" "}
                        / {event.reviewCard.vocabularyItem.meaning}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Felt {formatReviewGrade(event.grade)} / next review{" "}
                        {formatDateTime(event.nextDueAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-slate-500">
                      {formatDateTime(event.reviewedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Upcoming reviews" eyebrow="What is coming next">
          {dashboard.upcomingDueReviews.length === 0 ? (
            <EmptyPanelText
              actionHref="/vocabulary/new"
              actionLabel="Add vocabulary"
            >
              Active review cards will appear here after vocabulary is added.
            </EmptyPanelText>
          ) : (
            <ul className="divide-y divide-slate-200">
              {dashboard.upcomingDueReviews.map((card) => (
                <li key={card.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-teal-700">
                        {card.vocabularyItem.hanzi}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatPinyinForDisplay(card.vocabularyItem.pinyin)} /{" "}
                        {card.vocabularyItem.meaning}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        {card.vocabularyItem.level?.name ?? "No level"} / studied{" "}
                        {card.reviewCount} time
                        {card.reviewCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-slate-500">
                      {formatDateTime(card.dueAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="mt-8">
        <Panel title="Level progress" eyebrow="Where your words live">
          {dashboard.levelBreakdown.length === 0 ? (
            <EmptyPanelText actionHref="/vocabulary" actionLabel="View words">
              Level counts will appear after active vocabulary is assigned to a
              level.
            </EmptyPanelText>
          ) : (
            <div className="space-y-3">
              {dashboard.levelBreakdown.map((level) => (
                <div key={level.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {level.name}
                    </span>
                    <span className="text-slate-500">
                      {level._count.vocabularyItems}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{
                        width: `${Math.max(
                          8,
                          (level._count.vocabularyItems /
                            dashboard.activeVocabularyCount) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
      </div>
    </main>
  );
}

function MiniStat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "teal";
}) {
  const valueClassName = tone === "teal" ? "text-teal-800" : "text-slate-950";

  return (
    <div className="rounded-md bg-white p-4 shadow-sm ring-1 ring-teal-100/70">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  tone = "slate",
}: {
  label: string;
  value: number;
  helper: string;
  tone?: "slate" | "teal";
}) {
  const valueClassName = tone === "teal" ? "text-teal-700" : "text-slate-950";

  return (
    <div className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${valueClassName}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
      {eyebrow ? (
        <p className="text-sm font-semibold text-teal-700">{eyebrow}</p>
      ) : null}
      <h2 className={eyebrow ? "mt-1 text-xl font-semibold text-slate-950" : "text-xl font-semibold text-slate-950"}>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyPanelText({
  children,
  actionHref,
  actionLabel,
}: {
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div>
      <p className="text-slate-600">{children}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatReviewGrade(grade: string) {
  const labels: Record<string, string> = {
    AGAIN: "still learning",
    HARD: "hard but remembered",
    GOOD: "good",
    EASY: "easy",
  };

  return labels[grade] ?? grade.toLocaleLowerCase();
}
