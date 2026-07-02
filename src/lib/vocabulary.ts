"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCharacterNotesInput } from "@/lib/character-notes";
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

export async function createVocabularyItem(
  _previousState: CreateVocabularyState,
  formData: FormData,
): Promise<CreateVocabularyState> {
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
  const characterNotes = parseCharacterNotesInput(
    readOptionalString(formData, "characterNotes"),
  );

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.vocabularyItem.create({
      data: {
        hanzi,
        pinyin,
        meaning,
        deckId: optionalValues.deckId,
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
  const characterNotes = parseCharacterNotesInput(
    readOptionalString(formData, "characterNotes"),
  );

  await prisma.$transaction(async (tx) => {
    await tx.vocabularyItem.update({
      where: {
        id: vocabularyItemId,
      },
      data: {
        hanzi,
        pinyin,
        meaning,
        deckId: optionalValues.deckId,
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
  await prisma.$transaction(async (tx) => {
    await tx.vocabularyItem.update({
      where: {
        id: vocabularyItemId,
      },
      data: {
        isArchived: true,
        reviewCard: {
          update: {
            status: "ARCHIVED",
          },
        },
      },
    });
  });

  revalidatePath("/vocabulary");
  revalidatePath(`/vocabulary/${vocabularyItemId}`);
  redirect("/vocabulary");
}
