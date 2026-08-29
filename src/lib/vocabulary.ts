"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCharacterNotesInput } from "@/lib/character-notes";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  deleteUserVocabulary,
  ensureReviewCard,
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

    // 3. One card per join row, so the word is scheduled for review.
    await ensureReviewCard(tx, {
      userVocabularyId: userVocabulary.id,
      dueAt: now,
    });

    // Re-adding an archived word used to mint a fresh, immediately-due row.
    // Now that the add is idempotent, put the existing card back in service.
    await tx.reviewCard.updateMany({
      where: { userVocabularyId: userVocabulary.id, status: "ARCHIVED" },
      data: { status: "ACTIVE", dueAt: now },
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

  // The URL id is the catalog entry id; editing is gated on having a join row.
  const existing = await prisma.userVocabulary.findUnique({
    where: {
      userId_vocabularyItemId: {
        userId: user.id,
        vocabularyItemId,
      },
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
  const now = new Date();

  // When the spelling changes, the word moves to a different catalog entry, so
  // the redirect has to follow it there.
  let destinationVocabularyItemId = vocabularyItemId;

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
    destinationVocabularyItemId = catalogItem.id;

    // Editing hanzi/pinyin points the word at a different catalog entry, so the
    // previous join row no longer describes anything the user studies. Its card
    // and review history cascade away with it.
    if (catalogItem.id !== vocabularyItemId) {
      await deleteUserVocabulary(tx, existing.id);
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

    // A card always hangs off the join; a spelling change created a new join
    // row, so ensure it has one.
    await ensureReviewCard(tx, {
      userVocabularyId: userVocabulary.id,
      dueAt: now,
    });
  });

  revalidatePath("/vocabulary");
  revalidatePath(`/vocabulary/${destinationVocabularyItemId}`);
  redirect(`/vocabulary/${destinationVocabularyItemId}`);
}

export async function archiveVocabularyItem(vocabularyItemId: string) {
  const user = await requireCurrentUser();

  await prisma.$transaction(async (tx) => {
    const userVocabulary = await tx.userVocabulary.findUnique({
      where: {
        userId_vocabularyItemId: {
          userId: user.id,
          vocabularyItemId,
        },
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

    if (!userVocabulary) {
      return;
    }

    // Archiving is per-user: the shared catalog entry is never touched, so
    // other users studying the same word are unaffected.
    await tx.userVocabulary.update({
      where: { id: userVocabulary.id },
      data: { isArchived: true },
    });

    if (userVocabulary.reviewCard) {
      await tx.reviewCard.update({
        where: { id: userVocabulary.reviewCard.id },
        data: { status: "ARCHIVED" },
      });
    }
  });

  revalidatePath("/vocabulary");
  revalidatePath(`/vocabulary/${vocabularyItemId}`);
  redirect("/vocabulary");
}
