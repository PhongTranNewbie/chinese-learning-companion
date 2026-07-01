"use client";

import { useActionState } from "react";
import type { Deck } from "@prisma/client";
import {
  importVocabularyCsv,
  type ImportState,
} from "@/lib/vocabulary-import";

const initialState: ImportState = {};

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
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Default deck
        </span>
        <select
          name="deckId"
          defaultValue={defaultDeckId ?? ""}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
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
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
      </label>

      <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
        Required columns: `hanzi`, `pinyin`, `meaning`. Optional columns:
        `level`, `deck`, `partOfSpeech`, `measureWord`, `exampleChinese`,
        `examplePinyin`, `exampleEnglish`, `characterBreakdown`,
        `wordFormationNote`, `memoryMnemonic`, `notes`.
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
          className="w-full rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {isPending ? "Importing..." : "Import CSV"}
        </button>
      </div>
    </form>
  );
}
