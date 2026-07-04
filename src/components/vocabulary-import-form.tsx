"use client";

import { useActionState } from "react";
import type { Deck } from "@prisma/client";
import {
  importVocabularyCsv,
  type ImportState,
} from "@/lib/vocabulary-import";

const initialState: ImportState = {};
const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const primaryButtonClass =
  "w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto";

export function VocabularyImportForm({
  decks,
  defaultDeckId,
}: {
  decks: Deck[];
  defaultDeckId?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    importVocabularyCsv,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <section className="space-y-2 rounded-md bg-teal-50/50 p-4 text-sm text-slate-700 ring-1 ring-teal-100">
        <h2 className="font-semibold text-slate-950">Before you import</h2>
        <p>
          Use this for vocabulary you wrote or collected yourself. The importer
          will create vocabulary items and review cards from valid CSV rows.
        </p>
      </section>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Default deck
        </span>
        <select
          name="deckId"
          defaultValue={defaultDeckId ?? ""}
          className={fieldClass}
        >
          <option value="">No default deck</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">CSV file</span>
        <input
          type="file"
          name="csv"
          accept=".csv,text/csv"
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-800"
        />
      </label>

      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-100">
        <h2 className="font-semibold text-slate-950">CSV format</h2>
        <ul className="mt-3 space-y-2">
          <li>
            Required columns: <code>hanzi</code>, <code>pinyin</code>,{" "}
            <code>meaning</code>.
          </li>
          <li>
            Optional columns: <code>deck</code>, <code>level</code>,{" "}
            <code>characterBreakdown</code>, <code>wordFormationNote</code>,{" "}
            <code>memoryMnemonic</code>, and <code>characterNotes</code>.
          </li>
          <li>Save the file as CSV UTF-8 so Hanzi and tone marks stay readable.</li>
        </ul>
        <div className="mt-4 rounded-md bg-amber-50/70 p-3 ring-1 ring-amber-100">
          <p className="text-slate-700">
            Character notes use one line per character: character | components |
            component meanings | memory story. Memory stories are learning aids,
            not guaranteed historical etymology.
          </p>
        </div>
        <p className="mt-3 rounded-md bg-white p-3 font-mono text-xs leading-5 text-slate-700 ring-1 ring-slate-100">
          妈 | 女 + 马 | 女 = woman/female; 马 = horse | Memory aid: imagine a
          woman with a horse to remember mother.
        </p>
      </div>

      {state.errors?.length ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-800">Import errors</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {typeof state.created === "number" ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Imported {state.created} row{state.created === 1 ? "" : "s"}.
          Skipped {state.skipped ?? 0} duplicate row
          {(state.skipped ?? 0) === 1 ? "" : "s"}.
        </div>
      ) : null}

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className={primaryButtonClass}
        >
          {isPending ? "Importing..." : "Import CSV"}
        </button>
      </div>
    </form>
  );
}
