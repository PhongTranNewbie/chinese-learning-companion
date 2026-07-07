import Link from "next/link";
import { notFound } from "next/navigation";
import { VocabularyCreateForm } from "@/components/vocabulary-create-form";
import { requireCurrentUser } from "@/lib/current-user";
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
  const user = await requireCurrentUser();
  const { id } = await params;
  const [vocabularyItem, levels] = await Promise.all([
    prisma.vocabularyItem.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        characterNotes: {
          orderBy: {
            sortOrder: "asc",
          },
        },
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

  const deckFilters = vocabularyItem.deckId
    ? [
        { userId: user.id, isArchived: false },
        { userId: user.id, id: vocabularyItem.deckId },
      ]
    : [{ userId: user.id, isArchived: false }];

  const decks = await prisma.deck.findMany({
    where: {
      OR: deckFilters,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link
          href={`/vocabulary/${vocabularyItem.id}`}
          className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          Back to details
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Edit vocabulary
        </h1>
        <p className="mt-2 text-slate-600">
          Update the vocabulary details without changing the review card.
        </p>
      </div>

      <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <VocabularyCreateForm
          levels={levels}
          decks={decks}
          vocabularyItem={vocabularyItem}
        />
      </section>
    </main>
  );
}
