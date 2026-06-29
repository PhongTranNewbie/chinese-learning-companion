"use client";

import { useActionState } from "react";
import type { Deck } from "@prisma/client";
import { createDeck, type DeckFormState, updateDeck } from "@/lib/decks";

const initialState: DeckFormState = {};

export function DeckForm({ deck }: { deck?: Deck }) {
  const action = deck ? updateDeck.bind(null, deck.id) : createDeck;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Name *</span>
        <input
          name="name"
          defaultValue={deck?.name ?? ""}
          aria-invalid={state.errors?.name ? "true" : "false"}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
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
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
        />
      </label>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
        >
          {isPending ? "Saving..." : deck ? "Save deck" : "Create deck"}
        </button>
      </div>
    </form>
  );
}
