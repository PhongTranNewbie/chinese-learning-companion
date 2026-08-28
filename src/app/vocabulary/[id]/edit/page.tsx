import Link from "next/link";
import { notFound } from "next/navigation";
import { VocabularyCreateForm } from "@/components/vocabulary-create-form";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { findUserVocabularyForOwnedItem } from "@/lib/user-vocabulary";

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

  // The legacy owned row remains the URL/authorization anchor. Resolve it with
  // "id + userId", then read the form's values through the join that backs it.
  const vocabularyItem = await prisma.$transaction(async (tx) => {
    const owned = await tx.vocabularyItem.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        hanzi: true,
        pinyin: true,
        reviewCard: {
          select: {
            userVocabularyId: true,
          },
        },
      },
    });

    if (!owned) {
      return null;
    }

    const userVocabularyId = await findUserVocabularyForOwnedItem(tx, {
      userId: user.id,
      hanzi: owned.hanzi,
      pinyin: owned.pinyin,
      reviewCardUserVocabularyId: owned.reviewCard?.userVocabularyId ?? null,
    });

    if (userVocabularyId) {
      const userVocabulary = await tx.userVocabulary.findFirst({
        where: {
          id: userVocabularyId,
          userId: user.id,
        },
        include: {
          vocabularyItem: {
            include: {
              characterNotes: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      });

      if (userVocabulary) {
        return {
          // Catalog scalars come from the shared entry; per-user fields are
          // overridden from the join. The legacy owned id stays the id the
          // update action is bound to.
          ...userVocabulary.vocabularyItem,
          id: owned.id,
          deckId: userVocabulary.deckId,
          memoryMnemonic: userVocabulary.memoryMnemonic,
          notes: userVocabulary.personalNotes,
          meaning:
            userVocabulary.personalMeaning ??
            userVocabulary.vocabularyItem.meaning,
        };
      }
    }

    // No join yet: fall back to the legacy owned row's own fields.
    return tx.vocabularyItem.findFirst({
      where: {
        id: owned.id,
        userId: user.id,
      },
      include: {
        characterNotes: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });
  });

  if (!vocabularyItem) {
    notFound();
  }

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
