"use client";

import { useActionState } from "react";
import type { Deck } from "@prisma/client";
import { createDeck, type DeckFormState, updateDeck } from "@/lib/decks";

const initialState: DeckFormState = {};
const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
const primaryButtonClass =
  "w-full rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto";

export function DeckForm({ deck }: { deck?: Deck }) {
  const action = deck ? updateDeck.bind(null, deck.id) : createDeck;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-md bg-teal-50/50 p-4 text-sm text-slate-700 ring-1 ring-teal-100">
        A deck is a focused study set, such as greetings, family words, or a
        short HSK starter pack.
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">
          Name <span className="text-teal-700">*</span>
        </span>
        <input
          name="name"
          defaultValue={deck?.name ?? ""}
          aria-invalid={state.errors?.name ? "true" : "false"}
          className={fieldClass}
        />
        {state.errors?.name ? (
          <p className="text-sm text-red-700">{state.errors.name}</p>
        ) : null}
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={deck?.description ?? ""}
          className={fieldClass}
        />
        <p className="text-sm text-slate-500">
          A short description helps the deck feel clear when browsing study
          options.
        </p>
      </label>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className={primaryButtonClass}
        >
          {isPending ? "Saving..." : deck ? "Save deck" : "Create deck"}
        </button>
      </div>
    </form>
  );
}
