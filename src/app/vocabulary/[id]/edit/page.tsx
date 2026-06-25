import Link from "next/link";
import { notFound } from "next/navigation";
import { VocabularyCreateForm } from "@/components/vocabulary-create-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditVocabularyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditVocabularyPage({
  params,
}: EditVocabularyPageProps) {
  const { id } = await params;
  const [vocabularyItem, levels] = await Promise.all([
    prisma.vocabularyItem.findUnique({
      where: {
        id,
      },
    }),
    prisma.level.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ]);

  if (!vocabularyItem) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link
          href={`/vocabulary/${vocabularyItem.id}`}
          className="text-sm font-medium text-red-700"
        >
          Back to details
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Edit vocabulary
        </h1>
        <p className="mt-2 text-slate-600">
          Update the vocabulary details without changing the review card.
        </p>
      </div>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <VocabularyCreateForm
          levels={levels}
          vocabularyItem={vocabularyItem}
        />
      </section>
    </main>
  );
}
