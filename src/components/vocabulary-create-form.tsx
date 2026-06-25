"use client";

import { useActionState } from "react";
import type { Level } from "@prisma/client";
import {
  createVocabularyItem,
  type CreateVocabularyState,
} from "@/lib/vocabulary";

type VocabularyCreateFormProps = {
  levels: Level[];
};

const initialState: CreateVocabularyState = {};

export function VocabularyCreateForm({ levels }: VocabularyCreateFormProps) {
  const [state, formAction, isPending] = useActionState(
    createVocabularyItem,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-3">
        <Field label="Hanzi" name="hanzi" error={state.errors?.hanzi} required />
        <Field
          label="Pinyin"
          name="pinyin"
          error={state.errors?.pinyin}
          required
        />
        <Field
          label="Meaning"
          name="meaning"
          error={state.errors?.meaning}
          required
        />
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Level</span>
          <select
            name="levelId"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
          >
            <option value="">No level yet</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Part of speech" name="partOfSpeech" />
        <Field label="Measure word" name="measureWord" />
        <Field label="Example Chinese" name="exampleChinese" />
        <Field label="Example pinyin" name="examplePinyin" />
        <Field label="Example English" name="exampleEnglish" />
      </section>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Notes</span>
        <textarea
          name="notes"
          rows={4}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "Saving..." : "Create vocabulary"}
        </button>
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
};

function Field({ label, name, error, required = false }: FieldProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </span>
      <input
        name={name}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
      />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </label>
  );
}
