import Link from "next/link";
import { VocabularyImportForm } from "@/components/vocabulary-import-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type ImportPageProps = {
  searchParams: Promise<{
    deckId?: string;
  }>;
};

export default async function VocabularyImportPage({
  searchParams,
}: ImportPageProps) {
  const params = await searchParams;
  const decks = await prisma.deck.findMany({
    where: {
      isArchived: false,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link href="/vocabulary" className="text-sm font-medium text-red-700">
          Back to vocabulary
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Import vocabulary
        </h1>
        <p className="mt-2 text-slate-600">
          Upload a CSV of manually collected Mandarin vocabulary.
        </p>
      </div>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <VocabularyImportForm decks={decks} defaultDeckId={params.deckId} />
      </section>
    </main>
  );
}
