import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveCourse, archiveLesson } from "@/lib/courses";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type CourseDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { id } = await params;
  const now = new Date();
  const course = await prisma.course.findUnique({
    where: {
      id,
    },
    include: {
      lessons: {
        where: {
          isArchived: false,
        },
        include: {
          deck: {
            include: {
              vocabularyItems: {
                where: {
                  isArchived: false,
                },
                include: {
                  reviewCard: true,
                },
              },
            },
          },
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/courses" className="text-sm font-medium text-red-700">
            Back to courses
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {course.description ?? "No description yet."}
          </p>
          {course.isArchived ? (
            <p className="mt-3 inline-flex rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Archived
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          {!course.isArchived ? (
            <Link
              href={`/courses/${course.id}/lessons/new`}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
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
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Archive
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {course.lessons.length === 0 ? (
        <section className="mt-10 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No active lessons yet
          </h2>
          <p className="mt-2 text-slate-600">
            Add a lesson to start shaping this course.
          </p>
          {!course.isArchived ? (
            <Link
              href={`/courses/${course.id}/lessons/new`}
              className="mt-5 inline-flex rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
            >
              Add lesson
            </Link>
          ) : null}
        </section>
      ) : (
        <section className="mt-8 space-y-4">
          {course.lessons.map((lesson, index) => {
            const deck = lesson.deck;
            const activeDeck = deck && !deck.isArchived ? deck : null;
            const vocabularyCount = activeDeck?.vocabularyItems.length ?? 0;
            const dueCount =
              activeDeck?.vocabularyItems.filter(
                (item) =>
                  item.reviewCard?.status === "ACTIVE" &&
                  item.reviewCard.dueAt <= now,
              ).length ?? 0;

            return (
              <article
                key={lesson.id}
                className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Lesson {index + 1} / order {lesson.sortOrder}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      {lesson.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {lesson.description ?? "No lesson notes yet."}
                    </p>

                    {deck ? (
                      <div className="mt-4 rounded-md bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-950">
                          Linked deck: {deck.name}
                        </p>
                        {deck.isArchived ? (
                          <p className="mt-2 text-sm text-slate-600">
                            This deck is archived, so study links are hidden.
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-slate-600">
                            {vocabularyCount} active word
                            {vocabularyCount === 1 ? "" : "s"} / {dueCount} due now
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-md bg-slate-50 p-4">
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
                          className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
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
                    <Link
                      href={`/courses/${course.id}/lessons/${lesson.id}/edit`}
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                    <form action={archiveLesson.bind(null, course.id, lesson.id)}>
                      <button
                        type="submit"
                        className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                      >
                        Archive
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
