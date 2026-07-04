import Link from "next/link";
import { CourseForm } from "@/components/course-form";

export default function NewCoursePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link href="/courses" className="text-sm font-medium text-teal-700 transition hover:text-teal-800">
          Back to courses
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Create course
        </h1>
        <p className="mt-2 text-slate-600">
          Build a lightweight path that organizes lessons and decks.
        </p>
      </div>

      <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <CourseForm />
      </section>
    </main>
  );
}
