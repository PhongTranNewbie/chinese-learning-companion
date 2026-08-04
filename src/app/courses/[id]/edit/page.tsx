import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditCoursePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const course = await prisma.course.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="max-w-3xl">
      <div className="border-b border-slate-200 pb-6">
        <Link
          href={`/courses/${course.id}`}
          className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          Back to course
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Edit course
        </h1>
      </div>

      <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <CourseForm course={course} />
      </section>
        </div>
      </div>
    </main>
  );
}
