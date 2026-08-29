"use client";

import { useActionState } from "react";
import type {
  Deck,
  Level,
  VocabularyCharacterNote,
  VocabularyItem,
} from "@prisma/client";
import { serializeCharacterNotes } from "@/lib/character-notes";
import {
  createVocabularyItem,
  type CreateVocabularyState,
  updateVocabularyItem,
} from "@/lib/vocabulary";

// The form edits a catalog entry plus the user's join row, so it reads the
// per-user fields (which live on "UserVocabulary", not "VocabularyItem") in the
// same shape as the catalog scalars.
type VocabularyFormItem = Pick<
  VocabularyItem,
  | "id"
  | "hanzi"
  | "pinyin"
  | "meaning"
  | "deckId"
  | "levelId"
  | "partOfSpeech"
  | "measureWord"
  | "exampleChinese"
  | "examplePinyin"
  | "exampleEnglish"
  | "characterBreakdown"
  | "wordFormationNote"
> & {
  memoryMnemonic: string | null;
  notes: string | null;
  characterNotes?: VocabularyCharacterNote[];
};

type VocabularyCreateFormProps = {
  levels: Level[];
  decks: Deck[];
  defaultDeckId?: string;
  vocabularyItem?: VocabularyFormItem;
};

const initialState: CreateVocabularyState = {};
const characterNotesExample =
  "妈 | 女 + 马 | 女 = woman/female; 马 = horse | Memory aid: imagine a woman with a horse to remember mother.";
const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-teal-400 dark:focus:ring-teal-900";
const primaryButtonClass =
  "w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto";

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
      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Word essentials
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add the word exactly as you want it to appear during study.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
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
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Study context
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Optional details help you sort, review, and understand the word
            later.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Deck</span>
          <select
            name="deckId"
            defaultValue={vocabularyItem?.deckId ?? defaultDeckId ?? ""}
            className={fieldClass}
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
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Level</span>
          <select
            name="levelId"
            defaultValue={vocabularyItem?.levelId ?? ""}
            className={fieldClass}
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
        </div>
      </section>

      <section className="space-y-5 rounded-md border-l-4 border-amber-300 bg-slate-50 p-5 ring-1 ring-slate-200 dark:border-amber-500/70 dark:bg-slate-800 dark:ring-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Hanzi memory notes
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add personal memory clues for the whole word. These are learning
            aids, not guaranteed historical etymology.
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

      <section className="space-y-5 rounded-md border-l-4 border-teal-400 bg-slate-50 p-5 ring-1 ring-slate-200 dark:border-teal-400/70 dark:bg-slate-800 dark:ring-slate-700">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Character component stories
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Optional per-character stories make Hanzi easier to recall. Use one
            line per character.
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Format: character | components | component meanings | memory story.
            Memory stories are learning aids, not guaranteed historical
            etymology.
          </p>
          <p className="mt-3 rounded-md bg-white p-3 font-mono text-xs leading-5 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
            {characterNotesExample}
          </p>
        </div>
        <TextareaField
          label="Per-character notes"
          name="characterNotes"
          defaultValue={
            vocabularyItem?.characterNotes
              ? serializeCharacterNotes(vocabularyItem.characterNotes)
              : ""
          }
          rows={5}
        />
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
            Private notes
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Keep any extra context you want available on the detail page.
          </p>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</span>
          <textarea
            name="notes"
            rows={4}
            defaultValue={vocabularyItem?.notes ?? ""}
            className={fieldClass}
          />
        </label>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className={primaryButtonClass}
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
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        className={fieldClass}
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
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required ? <span className="text-teal-700"> *</span> : null}
      </span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : undefined}
        className={fieldClass}
      />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </label>
  );
}
