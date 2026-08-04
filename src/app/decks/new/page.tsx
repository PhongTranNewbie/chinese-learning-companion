import Link from "next/link";
import { DeckForm } from "@/components/deck-form";
import { requireCurrentUser } from "@/lib/current-user";

export default async function NewDeckPage() {
  await requireCurrentUser();

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="max-w-3xl">
      <div className="border-b border-slate-200 pb-6">
        <Link href="/decks" className="text-sm font-medium text-teal-700 transition hover:text-teal-800">
          Back to decks
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Create deck
        </h1>
        <p className="mt-2 text-slate-600">
          Create a study set for related Mandarin vocabulary.
        </p>
      </div>

      <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <DeckForm />
      </section>
        </div>
      </div>
    </main>
  );
}
