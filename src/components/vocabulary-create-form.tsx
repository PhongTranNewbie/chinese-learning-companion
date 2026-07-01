"use client";

import { useActionState } from "react";
import type { Deck, Level, VocabularyItem } from "@prisma/client";
import {
  createVocabularyItem,
  type CreateVocabularyState,
  updateVocabularyItem,
} from "@/lib/vocabulary";

type VocabularyCreateFormProps = {
  levels: Level[];
  decks: Deck[];
  defaultDeckId?: string;
  vocabularyItem?: VocabularyItem;
};

const initialState: CreateVocabularyState = {};

export function VocabularyCreateForm({
  levels,
  decks,
  defaultDeckId,
  vocabularyItem,
}: VocabularyCreateFormProps) {
  const action = vocabularyItem
    ? updateVocabularyItem.bind(null, vocabularyItem.id)
    : createVocabularyItem;
  const [state, formAction, isPending] = useActionState(
    action,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-8">
      <section className="grid gap-5 md:grid-cols-3">
        <Field
          label="Hanzi"
          name="hanzi"
          error={state.errors?.hanzi}
          defaultValue={vocabularyItem?.hanzi}
          required
        />
        <Field
          label="Pinyin"
          name="pinyin"
          error={state.errors?.pinyin}
          defaultValue={vocabularyItem?.pinyin}
          required
        />
        <Field
          label="Meaning"
          name="meaning"
          error={state.errors?.meaning}
          defaultValue={vocabularyItem?.meaning}
          required
        />
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Deck</span>
          <select
            name="deckId"
            defaultValue={vocabularyItem?.deckId ?? defaultDeckId ?? ""}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
          >
            <option value="">No deck yet</option>
            {decks.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Level</span>
          <select
            name="levelId"
            defaultValue={vocabularyItem?.levelId ?? ""}
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
        <Field
          label="Part of speech"
          name="partOfSpeech"
          defaultValue={vocabularyItem?.partOfSpeech}
        />
        <Field
          label="Measure word"
          name="measureWord"
          defaultValue={vocabularyItem?.measureWord}
        />
        <Field
          label="Example Chinese"
          name="exampleChinese"
          defaultValue={vocabularyItem?.exampleChinese}
        />
        <Field
          label="Example pinyin"
          name="examplePinyin"
          defaultValue={vocabularyItem?.examplePinyin}
        />
        <Field
          label="Example English"
          name="exampleEnglish"
          defaultValue={vocabularyItem?.exampleEnglish}
        />
      </section>

      <section className="space-y-5 rounded-md border border-slate-200 bg-slate-50 p-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Hanzi memory notes
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Use these as personal memory aids, not guaranteed historical
            etymology.
          </p>
        </div>
        <TextareaField
          label="Character breakdown"
          name="characterBreakdown"
          defaultValue={vocabularyItem?.characterBreakdown}
          rows={3}
        />
        <TextareaField
          label="Word formation note"
          name="wordFormationNote"
          defaultValue={vocabularyItem?.wordFormationNote}
          rows={3}
        />
        <TextareaField
          label="Memory mnemonic"
          name="memoryMnemonic"
          defaultValue={vocabularyItem?.memoryMnemonic}
          rows={3}
        />
      </section>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Notes</span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={vocabularyItem?.notes ?? ""}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {isPending
            ? "Saving..."
            : vocabularyItem
              ? "Save changes"
              : "Create vocabulary"}
        </button>
      </div>
    </form>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows = 4,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
      />
    </label>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  defaultValue?: string | null;
  required?: boolean;
};

function Field({
  label,
  name,
  error,
  defaultValue,
  required = false,
}: FieldProps) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-700"> *</span> : null}
      </span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
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
