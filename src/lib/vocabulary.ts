"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCharacterNotesInput } from "@/lib/character-notes";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type CreateVocabularyState = {
  errors?: Record<string, string>;
};

const optionalFields = [
  "deckId",
  "levelId",
  "partOfSpeech",
  "measureWord",
  "exampleChinese",
  "examplePinyin",
  "exampleEnglish",
  "characterBreakdown",
  "wordFormationNote",
  "memoryMnemonic",
  "notes",
] as const;

function readRequiredString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, field: string) {
  const value = formData.get(field);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function getOwnedDeckId(deckId: string | null, userId: string) {
  if (!deckId) {
    return null;
  }

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      userId,
      isArchived: false,
    },
    select: {
      id: true,
    },
  });

  return deck?.id ?? null;
}

export async function createVocabularyItem(
  _previousState: CreateVocabularyState,
  formData: FormData,
): Promise<CreateVocabularyState> {
  const user = await requireCurrentUser();
  const hanzi = readRequiredString(formData, "hanzi");
  const pinyin = readRequiredString(formData, "pinyin");
  const meaning = readRequiredString(formData, "meaning");

  const errors: Record<string, string> = {};

  if (!hanzi) {
    errors.hanzi = "Hanzi is required.";
  }

  if (!pinyin) {
    errors.pinyin = "Pinyin is required.";
  }

  if (!meaning) {
    errors.meaning = "Meaning is required.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const optionalValues = Object.fromEntries(
    optionalFields.map((field) => [field, readOptionalString(formData, field)]),
  );
  const deckId = await getOwnedDeckId(optionalValues.deckId, user.id);

  if (optionalValues.deckId && !deckId) {
    return { errors: { deckId: "Choose one of your active decks." } };
  }

  const characterNotes = parseCharacterNotesInput(
    readOptionalString(formData, "characterNotes"),
  );
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.vocabularyItem.create({
      data: {
        userId: user.id,
        hanzi,
        pinyin,
        meaning,
        deckId,
        levelId: optionalValues.levelId,
        partOfSpeech: optionalValues.partOfSpeech,
        measureWord: optionalValues.measureWord,
        exampleChinese: optionalValues.exampleChinese,
        examplePinyin: optionalValues.examplePinyin,
        exampleEnglish: optionalValues.exampleEnglish,
        characterBreakdown: optionalValues.characterBreakdown,
        wordFormationNote: optionalValues.wordFormationNote,
        memoryMnemonic: optionalValues.memoryMnemonic,
        notes: optionalValues.notes,
        reviewCard: {
          create: {
            dueAt: now,
          },
        },
        characterNotes: {
          create: characterNotes,
        },
      },
    });
  });

  revalidatePath("/vocabulary");
  redirect("/vocabulary");
}

export async function updateVocabularyItem(
  vocabularyItemId: string,
  _previousState: CreateVocabularyState,
  formData: FormData,
): Promise<CreateVocabularyState> {
  const user = await requireCurrentUser();
  const hanzi = readRequiredString(formData, "hanzi");
  const pinyin = readRequiredString(formData, "pinyin");
  const meaning = readRequiredString(formData, "meaning");

  const errors: Record<string, string> = {};

  if (!hanzi) {
    errors.hanzi = "Hanzi is required.";
  }

  if (!pinyin) {
    errors.pinyin = "Pinyin is required.";
  }

  if (!meaning) {
    errors.meaning = "Meaning is required.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const existing = await prisma.vocabularyItem.findFirst({
    where: {
      id: vocabularyItemId,
      userId: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    redirect("/vocabulary");
  }

  const optionalValues = Object.fromEntries(
    optionalFields.map((field) => [field, readOptionalString(formData, field)]),
  );
  const deckId = await getOwnedDeckId(optionalValues.deckId, user.id);

  if (optionalValues.deckId && !deckId) {
    return { errors: { deckId: "Choose one of your active decks." } };
  }

  const characterNotes = parseCharacterNotesInput(
    readOptionalString(formData, "characterNotes"),
  );

  await prisma.$transaction(async (tx) => {
    await tx.vocabularyItem.updateMany({
      where: {
        id: vocabularyItemId,
        userId: user.id,
      },
      data: {
        hanzi,
        pinyin,
        meaning,
        deckId,
        levelId: optionalValues.levelId,
        partOfSpeech: optionalValues.partOfSpeech,
        measureWord: optionalValues.measureWord,
        exampleChinese: optionalValues.exampleChinese,
        examplePinyin: optionalValues.examplePinyin,
        exampleEnglish: optionalValues.exampleEnglish,
        characterBreakdown: optionalValues.characterBreakdown,
        wordFormationNote: optionalValues.wordFormationNote,
        memoryMnemonic: optionalValues.memoryMnemonic,
        notes: optionalValues.notes,
      },
    });
    await tx.vocabularyCharacterNote.deleteMany({
      where: {
        vocabularyItemId,
        vocabularyItem: {
          userId: user.id,
        },
      },
    });
    if (characterNotes.length > 0) {
      await tx.vocabularyCharacterNote.createMany({
        data: characterNotes.map((note) => ({
          ...note,
          vocabularyItemId,
        })),
      });
    }
  });

  revalidatePath("/vocabulary");
  revalidatePath(`/vocabulary/${vocabularyItemId}`);
  redirect(`/vocabulary/${vocabularyItemId}`);
}

export async function archiveVocabularyItem(vocabularyItemId: string) {
  const user = await requireCurrentUser();

  await prisma.$transaction(async (tx) => {
    const vocabularyItem = await tx.vocabularyItem.findFirst({
      where: {
        id: vocabularyItemId,
        userId: user.id,
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

    if (!vocabularyItem) {
      return;
    }

    await tx.vocabularyItem.updateMany({
      where: {
        id: vocabularyItem.id,
        userId: user.id,
      },
      data: {
        isArchived: true,
      },
    });

    if (vocabularyItem.reviewCard) {
      await tx.reviewCard.update({
        where: {
          id: vocabularyItem.reviewCard.id,
        },
        data: {
          status: "ARCHIVED",
        },
      });
    }
  });

  revalidatePath("/vocabulary");
  revalidatePath(`/vocabulary/${vocabularyItemId}`);
  redirect("/vocabulary");
}
