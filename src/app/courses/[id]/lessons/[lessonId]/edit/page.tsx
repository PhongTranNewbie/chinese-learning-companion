import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonForm } from "@/components/lesson-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditLessonPageProps = {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
};

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { id, lessonId } = await params;
  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      courseId: id,
    },
    include: {
      course: true,
    },
  });

  if (!lesson) {
    notFound();
  }

  const deckFilters = lesson.deckId
    ? [{ isArchived: false }, { id: lesson.deckId }]
    : [{ isArchived: false }];

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
        <Link href={`/courses/${id}`} className="text-sm font-medium text-red-700">
          Back to course
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Edit lesson
        </h1>
      </div>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <LessonForm courseId={lesson.courseId} lesson={lesson} decks={decks} />
      </section>
    </main>
  );
}
