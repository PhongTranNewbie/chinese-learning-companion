import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getDashboardData();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-red-700">
            Chinese Learning Companion
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Learning dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Track vocabulary, due reviews, and recent study activity from your
            real learning data.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/review"
            className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
          >
            Review due cards
          </Link>
          <Link
            href="/vocabulary/new"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Add vocabulary
          </Link>
          <Link
            href="/vocabulary"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            View vocabulary
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Active vocabulary"
          value={dashboard.activeVocabularyCount}
        />
        <SummaryCard label="Due now" value={dashboard.dueReviewCount} />
        <SummaryCard
          label="Reviewed today"
          value={dashboard.reviewsCompletedToday}
        />
        <SummaryCard
          label="Archived vocabulary"
          value={dashboard.archivedVocabularyCount}
        />
      </section>

      {dashboard.activeVocabularyCount === 0 ? (
        <section className="mt-8 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No active vocabulary yet
          </h2>
          <p className="mt-2 text-slate-600">
            Add your first Mandarin word to create its review card and start
            filling the dashboard.
          </p>
          <div className="mt-5">
            <Link
              href="/vocabulary/new"
              className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
            >
              Add vocabulary
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent review activity">
          {dashboard.recentReviewEvents.length === 0 ? (
            <EmptyPanelText>
              Review history will appear here after you grade due cards.
            </EmptyPanelText>
          ) : (
            <ul className="divide-y divide-slate-200">
              {dashboard.recentReviewEvents.map((event) => (
                <li key={event.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-950">
                        {event.reviewCard.vocabularyItem.hanzi}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {event.grade} / next due {formatDateTime(event.nextDueAt)}
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

        <Panel title="Upcoming due reviews">
          {dashboard.upcomingDueReviews.length === 0 ? (
            <EmptyPanelText>
              Active review cards will appear here after vocabulary is added.
            </EmptyPanelText>
          ) : (
            <ul className="divide-y divide-slate-200">
              {dashboard.upcomingDueReviews.map((card) => (
                <li key={card.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-950">
                        {card.vocabularyItem.hanzi}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {card.vocabularyItem.level?.name ?? "No level"} /{" "}
                        reviewed {card.reviewCount} time
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
        <Panel title="Progress by level">
          {dashboard.levelBreakdown.length === 0 ? (
            <EmptyPanelText>
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
                      className="h-2 rounded-full bg-red-700"
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
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyPanelText({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-600">{children}</p>;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
