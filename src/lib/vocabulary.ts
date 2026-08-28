"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCharacterNotesInput } from "@/lib/character-notes";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  detachUserVocabulary,
  ensureOwnedReviewCard,
  findOwnedVocabularyItem,
  findUserVocabularyForOwnedItem,
  resolveSharedCatalogItem,
  upsertUserVocabulary,
} from "@/lib/user-vocabulary";

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

/**
 * Keep only values the form actually submitted.
 *
 * Adding a word is now idempotent, so a re-add updates the row the user already
 * has instead of minting a second one - and a field left blank on the add form
 * must not erase a mnemonic or note they wrote earlier. Clearing a value is what
 * the edit form is for.
 */
function onlySubmitted<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== null),
  ) as Partial<T>;
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
    // 1. One shared catalog entry per (hanzi, pinyin) - reused if it exists.
    const catalogItem = await resolveSharedCatalogItem(
      tx,
      {
        hanzi,
        pinyin,
        meaning,
        levelId: optionalValues.levelId,
        partOfSpeech: optionalValues.partOfSpeech,
        measureWord: optionalValues.measureWord,
        exampleChinese: optionalValues.exampleChinese,
        examplePinyin: optionalValues.examplePinyin,
        exampleEnglish: optionalValues.exampleEnglish,
        characterBreakdown: optionalValues.characterBreakdown,
        wordFormationNote: optionalValues.wordFormationNote,
      },
      characterNotes,
    );

    // 2. This user's own learning data for that entry.
    const perUserData = {
      deckId,
      // Only recorded when the user actually disagrees with the shared meaning.
      personalMeaning: meaning === catalogItem.meaning ? null : meaning,
      memoryMnemonic: optionalValues.memoryMnemonic,
      personalNotes: optionalValues.notes,
      isArchived: false,
    };
    const userVocabulary = await upsertUserVocabulary(tx, {
      userId: user.id,
      vocabularyItemId: catalogItem.id,
      create: perUserData,
      // Enrich, never erase: see onlySubmitted().
      update: onlySubmitted(perUserData),
    });

    // 3. The user's legacy owned row, still the source for today's read paths.
    const owned = await findOwnedVocabularyItem(tx, {
      userId: user.id,
      hanzi,
      pinyin,
    });

    const legacyData = {
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
      isArchived: false,
    };

    if (owned) {
      await tx.vocabularyItem.update({
        where: { id: owned.id },
        data: onlySubmitted(legacyData),
      });
      // Only replace the breakdown when the form actually supplied one.
      if (characterNotes.length > 0) {
        await tx.vocabularyCharacterNote.deleteMany({
          where: { vocabularyItemId: owned.id },
        });
        await tx.vocabularyCharacterNote.createMany({
          data: characterNotes.map((note) => ({
            ...note,
            vocabularyItemId: owned.id,
          })),
        });
      }
    }

    const ownedId =
      owned?.id ??
      (
        await tx.vocabularyItem.create({
          data: {
            userId: user.id,
            ...legacyData,
            characterNotes: { create: characterNotes },
          },
          select: { id: true },
        })
      ).id;

    const reviewCardId = await ensureOwnedReviewCard(tx, {
      vocabularyItemId: ownedId,
      reviewCardId: owned?.reviewCard?.id ?? null,
      userVocabularyId: userVocabulary.id,
      dueAt: now,
    });

    // Re-adding an archived word used to mint a fresh, immediately-due row.
    // Now that the add is idempotent, put the existing card back in service.
    if (owned?.isArchived && owned.reviewCard?.status === "ARCHIVED") {
      await tx.reviewCard.update({
        where: { id: reviewCardId },
        data: { status: "ACTIVE", dueAt: now },
      });
    }
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
      reviewCard: {
        select: {
          id: true,
          userVocabularyId: true,
        },
      },
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
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const catalogItem = await resolveSharedCatalogItem(
      tx,
      {
        hanzi,
        pinyin,
        meaning,
        levelId: optionalValues.levelId,
        partOfSpeech: optionalValues.partOfSpeech,
        measureWord: optionalValues.measureWord,
        exampleChinese: optionalValues.exampleChinese,
        examplePinyin: optionalValues.examplePinyin,
        exampleEnglish: optionalValues.exampleEnglish,
        characterBreakdown: optionalValues.characterBreakdown,
        wordFormationNote: optionalValues.wordFormationNote,
      },
      characterNotes,
    );

    // Editing hanzi/pinyin repoints the word at a different catalog entry, so
    // the previous join row no longer describes anything the user studies.
    const previousUserVocabularyId = existing.reviewCard?.userVocabularyId;

    if (previousUserVocabularyId) {
      const previous = await tx.userVocabulary.findFirst({
        where: {
          id: previousUserVocabularyId,
          userId: user.id,
          vocabularyItemId: { not: catalogItem.id },
        },
        select: { id: true },
      });

      if (previous) {
        await detachUserVocabulary(tx, previous.id);
      }
    }

    const perUserData = {
      deckId,
      personalMeaning: meaning === catalogItem.meaning ? null : meaning,
      memoryMnemonic: optionalValues.memoryMnemonic,
      personalNotes: optionalValues.notes,
    };
    const userVocabulary = await upsertUserVocabulary(tx, {
      userId: user.id,
      vocabularyItemId: catalogItem.id,
      create: { ...perUserData, isArchived: false },
      update: perUserData,
    });

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

    await ensureOwnedReviewCard(tx, {
      vocabularyItemId,
      reviewCardId: existing.reviewCard?.id ?? null,
      userVocabularyId: userVocabulary.id,
      dueAt: now,
    });
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
        hanzi: true,
        pinyin: true,
        reviewCard: {
          select: {
            id: true,
            userVocabularyId: true,
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

    // Archiving is per-user: the shared catalog entry is never touched, so other
    // users studying the same word are unaffected.
    const userVocabularyId = await findUserVocabularyForOwnedItem(tx, {
      userId: user.id,
      hanzi: vocabularyItem.hanzi,
      pinyin: vocabularyItem.pinyin,
      reviewCardUserVocabularyId:
        vocabularyItem.reviewCard?.userVocabularyId ?? null,
    });

    if (userVocabularyId) {
      await tx.userVocabulary.updateMany({
        where: {
          id: userVocabularyId,
          userId: user.id,
        },
        data: {
          isArchived: true,
        },
      });
    }

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
