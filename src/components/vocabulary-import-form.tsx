"use client";

import { useActionState, useState } from "react";
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

  const [showDetails, setShowDetails] = useState(false);

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
          <p className="font-semibold">Import complete</p>
          <ul className="mt-2 space-y-1">
            <li>Inserted: {state.created}</li>
            {(state.updated ?? 0) > 0 ? <li>Updated: {state.updated}</li> : null}
            {(state.skipped ?? 0) > 0 ? <li>Skipped: {state.skipped}</li> : null}
          </ul>

          {/* Hiển thị nút Toggle chi tiết nếu có Updated hoặc Skipped */}
          {(state.updatedItems?.length || state.skippedItems?.length) ? (
            <div className="mt-3 border-t border-green-200 pt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs font-semibold text-green-900 underline hover:text-green-950"
              >
                {showDetails ? "Hide import details ▲" : "View import details ▼"}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-3 text-xs">
                  {state.updatedItems?.length ? (
                    <div>
                      <span className="font-semibold text-amber-800">
                        Updated ({state.updatedItems.length}):
                      </span>
                      <ul className="mt-1 list-disc pl-5 space-y-0.5 text-slate-700">
                        {state.updatedItems.map((item, index) => (
                          <li key={index}>
                            <strong className="font-medium text-slate-900">{item.hanzi}</strong> ({item.pinyin})
                            {item.reason ? <span className="text-slate-500"> — {item.reason}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {state.skippedItems?.length ? (
                    <div>
                      <span className="font-semibold text-slate-600">
                        Skipped ({state.skippedItems.length}):
                      </span>
                      <ul className="mt-1 list-disc pl-5 space-y-0.5 text-slate-700">
                        {state.skippedItems.map((item, index) => (
                          <li key={index}>
                            <strong className="font-medium text-slate-900">{item.hanzi}</strong> ({item.pinyin})
                            {item.reason ? <span className="text-slate-500"> — {item.reason}</span> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
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