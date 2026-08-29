"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  ensureReviewCard,
  resolveSharedCatalogItem,
  upsertUserVocabulary,
} from "@/lib/user-vocabulary";

export type DeckFormState = {
  errors?: Record<string, string>;
};

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createDeck(
  _previousState: DeckFormState,
  formData: FormData,
): Promise<DeckFormState> {
  const user = await requireCurrentUser();
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (!name) {
    return { errors: { name: "Deck name is required." } };
  }

  await prisma.deck.create({
    data: {
      userId: user.id,
      name,
      description: description || null,
    },
  });

  revalidatePath("/decks");
  redirect("/decks");
}

export async function updateDeck(
  deckId: string,
  _previousState: DeckFormState,
  formData: FormData,
): Promise<DeckFormState> {
  const user = await requireCurrentUser();
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (!name) {
    return { errors: { name: "Deck name is required." } };
  }

  const result = await prisma.deck.updateMany({
    where: {
      id: deckId,
      userId: user.id,
    },
    data: {
      name,
      description: description || null,
    },
  });

  if (result.count === 0) {
    redirect("/decks");
  }

  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}

export async function archiveDeck(deckId: string) {
  const user = await requireCurrentUser();

  await prisma.deck.updateMany({
    where: {
      id: deckId,
      userId: user.id,
    },
    data: {
      isArchived: true,
    },
  });

  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  redirect("/decks");
}

export async function resetDeckReviewProgress(
  deckId: string,
  formData: FormData,
) {
  const user = await requireCurrentUser();
  const confirmed = formData.get("confirmReset") === "on";

  if (!confirmed) {
    redirect(`/decks/${deckId}`);
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!deck) {
    redirect("/decks");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Deck membership is read through the user's join rows (Phase 4A); the card
    // being reset is the join's review card.
    const userVocabularies = await tx.userVocabulary.findMany({
      where: {
        deckId,
        userId: user.id,
        isArchived: false,
      },
      select: {
        id: true,
        reviewCard: {
          select: {
            id: true,
          },
        },
      },
    });

    const reviewCardIds = userVocabularies
      .map((uv) => uv.reviewCard?.id)
      .filter((id): id is string => Boolean(id));

    if (reviewCardIds.length > 0) {
      await tx.reviewEvent.deleteMany({
        where: {
          reviewCardId: {
            in: reviewCardIds,
          },
        },
      });

      await tx.reviewCard.updateMany({
        where: {
          id: {
            in: reviewCardIds,
          },
          userVocabulary: {
            deckId,
            userId: user.id,
            isArchived: false,
          },
        },
        data: {
          dueAt: now,
          intervalDays: 0,
          easeFactor: 2.5,
          reviewCount: 0,
          lapseCount: 0,
          lastReviewedAt: null,
          status: "ACTIVE",
        },
      });
    }

    const userVocabulariesWithoutCards = userVocabularies.filter(
      (uv) => !uv.reviewCard,
    );

    if (userVocabulariesWithoutCards.length > 0) {
      // Defensive: Phase 5 writes always create a card for a join row, but if
      // one is missing, create it hanging off the join (the card's only anchor
      // now that "ReviewCard.vocabularyItemId" is gone).
      await tx.reviewCard.createMany({
        data: userVocabulariesWithoutCards.map((uv) => ({
          userVocabularyId: uv.id,
          dueAt: now,
        })),
      });
    }
  });

  revalidatePath("/review");
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
  redirect(`/decks/${deckId}?progress=reset`);
}
export async function copyPublicDeckToLibrary(publicDeckId: string) {
  const user = await requireCurrentUser();

  const publicDeck = await prisma.deck.findFirst({
    where: {
      id: publicDeckId,
      userId: null,
      isArchived: false,
    },
    include: {
      vocabularyItems: {
        include: {
          characterNotes: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!publicDeck) {
    redirect("/decks");
  }

  const existingDeck = await prisma.deck.findFirst({
    where: {
      userId: user.id,
      name: publicDeck.name,
    },
    select: {
      id: true,
    },
  });

  if (existingDeck) {
    redirect(`/decks/${existingDeck.id}`);
  }

  const now = new Date();
  const copiedDeck = await prisma.$transaction(async (tx) => {
    const deck = await tx.deck.create({
      data: {
        userId: user.id,
        name: publicDeck.name,
        description: publicDeck.description,
      },
      select: {
        id: true,
      },
    });

    for (const item of publicDeck.vocabularyItems) {
      const templateNotes = item.characterNotes.map((note) => ({
        character: note.character,
        components: note.components,
        componentMeanings: note.componentMeanings,
        mnemonicStory: note.mnemonicStory,
        sortOrder: note.sortOrder,
      }));

      // Reuse the shared catalog entry rather than cloning it for this user.
      const catalogItem = await resolveSharedCatalogItem(
        tx,
        {
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          meaning: item.meaning,
          levelId: item.levelId,
          partOfSpeech: item.partOfSpeech,
          measureWord: item.measureWord,
          exampleChinese: item.exampleChinese,
          examplePinyin: item.examplePinyin,
          exampleEnglish: item.exampleEnglish,
          characterBreakdown: item.characterBreakdown,
          wordFormationNote: item.wordFormationNote,
        },
        templateNotes,
      );

      // Copying puts the word in the new deck, but a word the user already
      // studies keeps its own mnemonic, notes and review history. The catalog
      // entry already carries the template's shared mnemonic/notes, so the join
      // only needs the new deck membership.
      const userVocabulary = await upsertUserVocabulary(tx, {
        userId: user.id,
        vocabularyItemId: catalogItem.id,
        create: {
          deckId: deck.id,
          isArchived: false,
        },
        update: {
          deckId: deck.id,
          isArchived: false,
        },
      });

      await ensureReviewCard(tx, {
        userVocabularyId: userVocabulary.id,
        dueAt: now,
      });

      // A copy used to produce a fresh, immediately-due card. Reusing an
      // archived word's card would otherwise leave it stuck out of rotation.
      await tx.reviewCard.updateMany({
        where: { userVocabularyId: userVocabulary.id, status: "ARCHIVED" },
        data: { status: "ACTIVE", dueAt: now },
      });
    }

    return deck;
  });

  revalidatePath("/decks");
  revalidatePath("/vocabulary");
  revalidatePath(`/decks/${publicDeckId}`);
  redirect(`/decks/${copiedDeck.id}`);
}
