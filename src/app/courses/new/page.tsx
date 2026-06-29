import Link from "next/link";
import { CourseForm } from "@/components/course-form";

export default function NewCoursePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link href="/courses" className="text-sm font-medium text-red-700">
          Back to courses
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Create course
        </h1>
        <p className="mt-2 text-slate-600">
          Build a lightweight path that organizes lessons and decks.
        </p>
      </div>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <CourseForm />
      </section>
    </main>
  );
}
