import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonForm } from "@/components/lesson-form";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditLessonPageProps = {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
};

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const user = await requireCurrentUser();
  const { id, lessonId } = await params;
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      courseId: id,
      course: {
        userId: user.id,
      },
    },
    include: {
      course: true,
    },
  });

  if (!lesson) {
    notFound();
  }

  const deckFilters = lesson.deckId
    ? [
        { userId: user.id, isArchived: false },
        { userId: user.id, id: lesson.deckId },
      ]
    : [{ userId: user.id, isArchived: false }];

  const decks = await prisma.deck.findMany({
    where: {
      OR: deckFilters,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link
          href={`/courses/${id}`}
          className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          Back to course
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Edit lesson
        </h1>
      </div>

      <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <LessonForm courseId={lesson.courseId} lesson={lesson} decks={decks} />
      </section>
    </main>
  );
}
