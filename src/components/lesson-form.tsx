"use client";

import { useActionState } from "react";
import type { Deck, Lesson } from "@prisma/client";
import {
  createLesson,
  type LessonFormState,
  updateLesson,
} from "@/lib/courses";

const initialState: LessonFormState = {};
const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const primaryButtonClass =
  "w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto";

type LessonFormProps = {
  courseId: string;
  lesson?: Lesson;
  decks: Deck[];
};

export function LessonForm({ courseId, lesson, decks }: LessonFormProps) {
  const action = lesson
    ? updateLesson.bind(null, courseId, lesson.id)
    : createLesson.bind(null, courseId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-md bg-teal-50/50 p-4 text-sm text-slate-700 ring-1 ring-teal-100">
        Lessons are simple steps in a course. Link a deck when this lesson
        should lead directly into study.
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Title <span className="text-teal-700">*</span>
        </span>
        <input
          name="title"
          defaultValue={lesson?.title ?? ""}
          aria-invalid={state.errors?.title ? "true" : "false"}
          className={fieldClass}
        />
        {state.errors?.title ? (
          <p className="text-sm text-red-700">{state.errors.title}</p>
        ) : null}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Order</span>
        <input
          name="sortOrder"
          type="number"
          step="1"
          defaultValue={lesson?.sortOrder ?? 0}
          aria-invalid={state.errors?.sortOrder ? "true" : "false"}
          className={fieldClass}
        />
        {state.errors?.sortOrder ? (
          <p className="text-sm text-red-700">{state.errors.sortOrder}</p>
        ) : (
          <p className="text-sm text-slate-500">
            Lower numbers appear earlier in the course.
          </p>
        )}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Linked deck</span>
        <select
          name="deckId"
          defaultValue={lesson?.deckId ?? ""}
          className={fieldClass}
        >
          <option value="">No linked deck</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={lesson?.description ?? ""}
          className={fieldClass}
        />
        <p className="text-sm text-slate-500">
          Add a short note about what the learner should focus on in this step.
        </p>
      </label>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className={primaryButtonClass}
        >
          {isPending ? "Saving..." : lesson ? "Save lesson" : "Create lesson"}
        </button>
      </div>
    </form>
  );
}
