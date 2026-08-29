import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { shouldShowDeckStudyActions } from "@/lib/archive-rules";
import { archiveCourse, archiveLesson } from "@/lib/courses";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type CourseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const { id } = await params;
  const now = new Date();
  const course = await prisma.course.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      lessons: {
        where: {
          isArchived: false,
        },
        include: {
          deck: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  if (!course) {
    notFound();
  }

  // A lesson's linked deck can be the user's own or a public/template deck.
  // Owned decks count active words and due cards through the user's join rows;
  // public decks count their shared catalog items - they have no per-user cards
  // (Phase 5 removed template cards), so nothing is due until the deck is copied.
  const linkedDeckIds = [
    ...new Set(
      course.lessons
        .flatMap((lesson) => (lesson.deck ? [lesson.deck.id] : []))
        .map((id) => id),
    ),
  ];
  const [publicItems, ownedMemberships] = await Promise.all([
    linkedDeckIds.length > 0
      ? prisma.vocabularyItem.findMany({
          where: {
            deckId: { in: linkedDeckIds },
          },
          select: {
            deckId: true,
          },
        })
      : Promise.resolve([]),
    user && linkedDeckIds.length > 0
      ? prisma.userVocabulary.findMany({
          where: {
            deckId: { in: linkedDeckIds },
            userId: user.id,
            isArchived: false,
          },
          select: {
            deckId: true,
            reviewCard: { select: { status: true, dueAt: true } },
          },
        })
      : Promise.resolve([]),
  ]);
  const deckStats = new Map<
    string,
    { vocabularyCount: number; dueCount: number }
  >();
  for (const lesson of course.lessons) {
    if (!lesson.deck || deckStats.has(lesson.deck.id)) {
      continue;
    }
    const deckId = lesson.deck.id;
    const isPublicDeck = lesson.deck.userId === null;

    if (isPublicDeck) {
      // Template decks have no per-user cards, so nothing is due until copied.
      deckStats.set(deckId, {
        vocabularyCount: publicItems.filter(
          (item) => item.deckId === deckId,
        ).length,
        dueCount: 0,
      });
      continue;
    }

    const rows = ownedMemberships.filter((item) => item.deckId === deckId);
    deckStats.set(deckId, {
      vocabularyCount: rows.length,
      dueCount: rows.filter(
        (item) =>
          item.reviewCard?.status === "ACTIVE" && item.reviewCard.dueAt <= now,
      ).length,
    });
  }

  const activeLessonCount = course.lessons.length;
  const linkedDeckCount = course.lessons.filter(
    (lesson) => lesson.deck && shouldShowDeckStudyActions(lesson.deck),
  ).length;

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href="/courses"
                className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
              >
                Back to courses
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">
                  {course.title}
                </h1>
                {course.isArchived ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                    Archived
                  </span>
                ) : null}
              </div>
              <p className="mt-2 max-w-2xl text-slate-600">
                {course.description ??
                  "A simple learning path made from ordered lessons."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <SummaryPill
                  label={`${activeLessonCount} lesson${
                    activeLessonCount === 1 ? "" : "s"
                  }`}
                  tone="teal"
                />
                <SummaryPill
                  label={`${linkedDeckCount} linked deck${
                    linkedDeckCount === 1 ? "" : "s"
                  }`}
                />
              </div>
            </div>
            {user ? (
              <div className="flex flex-wrap gap-3 lg:justify-end">
                {!course.isArchived ? (
                  <Link
                    href={`/courses/${course.id}/lessons/new`}
                    className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                  >
                    Add lesson
                  </Link>
                ) : null}
                <Link
                  href={`/courses/${course.id}/edit`}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit
                </Link>
                {!course.isArchived ? (
                  <form action={archiveCourse.bind(null, course.id)}>
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Archive
                    </button>
                  </form>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

      {course.lessons.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon="课"
            title="No active lessons yet"
            actionHref={user && !course.isArchived ? `/courses/${course.id}/lessons/new` : undefined}
            actionLabel={user && !course.isArchived ? "Add lesson" : undefined}
          >
            {course.isArchived
              ? "This archived course has no active lesson steps."
              : "Add a lesson to start shaping this course into a step-by-step learning path."}
          </EmptyState>
        </div>
      ) : (
        <section className="mt-8 space-y-4">
          {course.lessons.map((lesson, index) => {
            const deck = lesson.deck;
            const activeDeck = shouldShowDeckStudyActions(deck) ? deck : null;
            const deckStat = activeDeck
              ? deckStats.get(activeDeck.id) ?? { vocabularyCount: 0, dueCount: 0 }
              : null;
            const vocabularyCount = deckStat?.vocabularyCount ?? 0;
            const dueCount = deckStat?.dueCount ?? 0;

            return (
              <article
                key={lesson.id}
                className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700 ring-1 ring-teal-100">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-500">
                          Lesson step / order {lesson.sortOrder}
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                          {lesson.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {lesson.description ?? "No lesson notes yet."}
                        </p>
                      </div>
                    </div>

                    {deck ? (
                      <div className="mt-5 rounded-md bg-teal-50/60 p-4 ring-1 ring-teal-100">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-teal-900">
                              Linked deck
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-950">
                              {deck.name}
                            </p>
                          </div>
                          {!deck.isArchived ? (
                            <div className="flex flex-wrap gap-2">
                              <DeckStat
                                label={`${vocabularyCount} word${
                                  vocabularyCount === 1 ? "" : "s"
                                }`}
                              />
                              <DeckStat label={`${dueCount} due now`} />
                            </div>
                          ) : null}
                        </div>
                        {deck.isArchived ? (
                          <p className="mt-3 text-sm text-slate-600">
                            This deck is archived, so study links are hidden.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
                        <p className="text-sm text-slate-600">
                          No deck linked yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    {activeDeck ? (
                      <>
                        <Link
                          href={`/decks/${activeDeck.id}/study`}
                          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                        >
                          Study
                        </Link>
                        <Link
                          href={`/decks/${activeDeck.id}/study?mode=due`}
                          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Review due
                        </Link>
                      </>
                    ) : null}
                    {user ? (
                      <>
                        <Link
                          href={`/courses/${course.id}/lessons/${lesson.id}/edit`}
                          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <form action={archiveLesson.bind(null, course.id, lesson.id)}>
                          <button
                            type="submit"
                            className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                          >
                            Archive
                          </button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
      </div>
    </main>
  );
}

function SummaryPill({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "teal";
}) {
  const className =
    tone === "teal"
      ? "bg-teal-50 text-teal-700 ring-teal-100"
      : "bg-slate-50 text-slate-600 ring-slate-100";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${className}`}>
      {label}
    </span>
  );
}

function DeckStat({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-800 ring-1 ring-teal-100">
      {label}
    </span>
  );
}
