"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

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
        where: {
          isArchived: false,
        },
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
      const characterNotes =
        item.characterNotes.length > 0
          ? {
              create: item.characterNotes.map((note) => ({
                character: note.character,
                components: note.components,
                componentMeanings: note.componentMeanings,
                mnemonicStory: note.mnemonicStory,
                sortOrder: note.sortOrder,
              })),
            }
          : undefined;

      await tx.vocabularyItem.create({
        data: {
          userId: user.id,
          deckId: deck.id,
          levelId: item.levelId,
          hanzi: item.hanzi,
          pinyin: item.pinyin,
          meaning: item.meaning,
          partOfSpeech: item.partOfSpeech,
          measureWord: item.measureWord,
          exampleChinese: item.exampleChinese,
          examplePinyin: item.examplePinyin,
          exampleEnglish: item.exampleEnglish,
          characterBreakdown: item.characterBreakdown,
          wordFormationNote: item.wordFormationNote,
          memoryMnemonic: item.memoryMnemonic,
          notes: item.notes,
          source: item.source,
          reviewCard: {
            create: {
              dueAt: now,
            },
          },
          characterNotes,
        },
      });
    }

    return deck;
  });

  revalidatePath("/decks");
  revalidatePath("/vocabulary");
  revalidatePath(`/decks/${publicDeckId}`);
  redirect(`/decks/${copiedDeck.id}`);
}
