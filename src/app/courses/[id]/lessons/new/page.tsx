import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonForm } from "@/components/lesson-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type NewLessonPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewLessonPage({ params }: NewLessonPageProps) {
  const { id } = await params;
  const [course, decks] = await Promise.all([
    prisma.course.findFirst({
      where: {
        id,
        isArchived: false,
      },
    }),
    prisma.deck.findMany({
      where: {
        isArchived: false,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link
          href={`/courses/${course.id}`}
          className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          Back to course
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Create lesson
        </h1>
        <p className="mt-2 text-slate-600">
          Add a lightweight lesson and optionally link it to a deck.
        </p>
      </div>

      <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <LessonForm courseId={course.id} decks={decks} />
      </section>
    </main>
  );
}
