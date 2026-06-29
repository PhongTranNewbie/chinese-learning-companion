import Link from "next/link";
import { VocabularyCreateForm } from "@/components/vocabulary-create-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type NewVocabularyPageProps = {
  searchParams: Promise<{
    deckId?: string;
  }>;
};

export default async function NewVocabularyPage({
  searchParams,
}: NewVocabularyPageProps) {
  const params = await searchParams;
  const [levels, decks] = await Promise.all([
    prisma.level.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    }),
    prisma.deck.findMany({
      where: {
        isArchived: false,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link href="/vocabulary" className="text-sm font-medium text-red-700">
          Back to vocabulary
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Add vocabulary
        </h1>
        <p className="mt-2 text-slate-600">
          Save a Mandarin word or phrase and create its first review card.
        </p>
      </div>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <VocabularyCreateForm
          levels={levels}
          decks={decks}
          defaultDeckId={params.deckId}
        />
      </section>
    </main>
  );
}
