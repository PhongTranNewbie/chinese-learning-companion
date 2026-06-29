import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/course-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditCoursePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: {
      id,
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link href={`/courses/${course.id}`} className="text-sm font-medium text-red-700">
          Back to course
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Edit course
        </h1>
      </div>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <CourseForm course={course} />
      </section>
    </main>
  );
}
