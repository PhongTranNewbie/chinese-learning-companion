"use client";

import { useActionState } from "react";
import type { Course } from "@prisma/client";
import {
  createCourse,
  type CourseFormState,
  updateCourse,
} from "@/lib/courses";

const initialState: CourseFormState = {};
const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const primaryButtonClass =
  "w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto";

export function CourseForm({ course }: { course?: Course }) {
  const action = course ? updateCourse.bind(null, course.id) : createCourse;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-md bg-teal-50/50 p-4 text-sm text-slate-700 ring-1 ring-teal-100">
        A course is a lightweight path made from ordered lesson steps. Keep it
        short enough to feel doable.
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Title <span className="text-teal-700">*</span>
        </span>
        <input
          name="title"
          defaultValue={course?.title ?? ""}
          aria-invalid={state.errors?.title ? "true" : "false"}
          className={fieldClass}
        />
        {state.errors?.title ? (
          <p className="text-sm text-red-700">{state.errors.title}</p>
        ) : null}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={course?.description ?? ""}
          className={fieldClass}
        />
        <p className="text-sm text-slate-500">
          Describe the learning goal so the path feels easy to return to.
        </p>
      </label>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className={primaryButtonClass}
        >
          {isPending ? "Saving..." : course ? "Save course" : "Create course"}
        </button>
      </div>
    </form>
  );
}
