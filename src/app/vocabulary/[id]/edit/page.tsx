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

  // The URL id is the shared catalog entry id. Editing is gated on having a
  // join row: catalog scalars come from the shared entry, and the user's own
  // mnemonic, notes, deck and meaning override from the join.
  const [catalogItem, userVocabulary] = await Promise.all([
    prisma.vocabularyItem.findUnique({
      where: { id },
      include: {
        characterNotes: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    }),
    prisma.userVocabulary.findUnique({
      where: {
        userId_vocabularyItemId: { userId: user.id, vocabularyItemId: id },
      },
    }),
  ]);

  if (!catalogItem || !userVocabulary) {
    notFound();
  }

  const vocabularyItem = {
    ...catalogItem,
    id: catalogItem.id,
    deckId: userVocabulary.deckId,
    memoryMnemonic: userVocabulary.memoryMnemonic,
    notes: userVocabulary.personalNotes,
    meaning: userVocabulary.personalMeaning ?? catalogItem.meaning,
  };

  const deckFilters = vocabularyItem.deckId
    ? [
        { userId: user.id, isArchived: false },
        { userId: user.id, id: vocabularyItem.deckId },
      ]
    : [{ userId: user.id, isArchived: false }];

  const [levels, decks] = await Promise.all([
    prisma.level.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    }),
    prisma.deck.findMany({
      where: {
        OR: deckFilters,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="max-w-4xl">
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
        </div>
      </div>
    </main>
  );
}
