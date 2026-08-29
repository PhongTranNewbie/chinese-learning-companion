"use server";

import { revalidatePath } from "next/cache";
import { parseCharacterNotesInput } from "@/lib/character-notes";
import { parseCsv } from "@/lib/csv";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  ensureReviewCard,
  resolveSharedCatalogItem,
} from "@/lib/user-vocabulary";
import { validateVocabularyImportRows } from "@/lib/vocabulary-import-validation";

export type ImportDetailItem = {
  hanzi: string;
  pinyin: string;
  reason?: string;
};

export type ImportState = {
  created?: number;
  updated?: number;
  skipped?: number;
  errors?: string[];
  updatedItems?: ImportDetailItem[];
  skippedItems?: ImportDetailItem[];
};

export async function importVocabularyCsv(
  _previousState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const user = await requireCurrentUser();
  const file = formData.get("csv");
  const defaultDeckId = readOptionalString(formData, "deckId");

  if (!(file instanceof File) || file.size === 0) {
    return { errors: ["Choose a CSV file to import."] };
  }

  if (defaultDeckId) {
    const defaultDeck = await prisma.deck.findFirst({
      where: {
        id: defaultDeckId,
        userId: user.id,
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

    if (!defaultDeck) {
      return { errors: ["Choose one of your active decks before importing."] };
    }
  }

  const updatedItems: ImportDetailItem[] = [];
  const skippedItems: ImportDetailItem[] = [];

  const content = await file.text();
  const rows = parseCsv(content);

  if (rows.length === 0) {
    return { errors: ["CSV file has no data rows."] };
  }

  const { errors, validRows } = validateVocabularyImportRows(rows);

  if (errors.length > 0) {
    return { errors };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const now = new Date();
  const seenRows = new Set<string>();

  await prisma.$transaction(async (tx) => {
    for (const { row, duplicateKey } of validRows) {
      if (seenRows.has(duplicateKey)) {
        skipped += 1;
        skippedItems.push({
        hanzi: row.hanzi.trim(),
        pinyin: row.pinyin.trim(),
        reason: "Duplicate entry in CSV file",
      });
        continue;
      }
      seenRows.add(duplicateKey);

      const hanzi = row.hanzi.trim();
      const pinyin = row.pinyin.trim();

      const deckId = row.deck?.trim()
        ? await getOrCreateDeckId(tx, row.deck.trim(), user.id)
        : defaultDeckId;
      const levelId = row.level?.trim()
        ? await getLevelId(tx, row.level.trim())
        : null;

      const newMeaning = row.meaning.trim();
      const newPartOfSpeech = normalizeOptional(row.partOfSpeech);
      const newMeasureWord = normalizeOptional(row.measureWord);
      const newExampleChinese = normalizeOptional(row.exampleChinese);
      const newExamplePinyin = normalizeOptional(row.examplePinyin);
      const newExampleEnglish = normalizeOptional(row.exampleEnglish);
      const newCharacterBreakdown = normalizeOptional(row.characterBreakdown);
      const newWordFormationNote = normalizeOptional(row.wordFormationNote);
      const newMemoryMnemonic = normalizeOptional(row.memoryMnemonic);
      const newNotes = normalizeOptional(row.notes);
      const characterNotes = parseCharacterNotesInput(row.characterNotes);

      // One shared catalog entry per (hanzi, pinyin), reused across users and
      // only ever enriched - an import never rewrites a value someone else's
      // study material already depends on.
      const catalogItem = await resolveSharedCatalogItem(
        tx,
        {
          hanzi,
          pinyin,
          meaning: newMeaning,
          levelId,
          partOfSpeech: newPartOfSpeech,
          measureWord: newMeasureWord,
          exampleChinese: newExampleChinese,
          examplePinyin: newExamplePinyin,
          exampleEnglish: newExampleEnglish,
          characterBreakdown: newCharacterBreakdown,
          wordFormationNote: newWordFormationNote,
        },
        characterNotes,
      );

      // Merge into the importing user's own join row. Importing used to look the
      // spelling up globally and claim an owned row; now the per-user data lives
      // on the join itself, and catalog columns were already enriched separately
      // by resolveSharedCatalogItem above.
      const existing = await tx.userVocabulary.findUnique({
        where: {
          userId_vocabularyItemId: {
            userId: user.id,
            vocabularyItemId: catalogItem.id,
          },
        },
      });

      let userVocabularyId: string;

      if (existing) {
        // UPSERT: update the join row. Longer/richer wins for the meaning and
        // mnemonic, notes append, and an archived word is brought back.
        const updates: Record<string, string | boolean | null> = {};
        let shouldUpdate = false;

        const currentMeaning = existing.personalMeaning ?? catalogItem.meaning;
        if (newMeaning && newMeaning.length > currentMeaning.length) {
          updates.personalMeaning = newMeaning;
          shouldUpdate = true;
        }

        if (
          newMemoryMnemonic &&
          (!existing.memoryMnemonic ||
            newMemoryMnemonic.length > existing.memoryMnemonic.length)
        ) {
          updates.memoryMnemonic = newMemoryMnemonic;
          shouldUpdate = true;
        }

        if (newNotes) {
          if (!existing.personalNotes) {
            updates.personalNotes = newNotes;
            shouldUpdate = true;
          } else if (!existing.personalNotes.includes(newNotes)) {
            updates.personalNotes = `${existing.personalNotes}\n\n${newNotes}`;
            shouldUpdate = true;
          }
        }

        if (existing.isArchived) {
          updates.isArchived = false;
          shouldUpdate = true;
        }

        if (deckId && deckId !== existing.deckId) {
          updates.deckId = deckId;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          if (Object.keys(updates).length > 0) {
            await tx.userVocabulary.update({
              where: { id: existing.id },
              data: updates,
            });
          }
          updated += 1;
          updatedItems.push({
            hanzi,
            pinyin,
            reason: "Updated existing card details",
          });
        } else {
          skipped += 1;
          skippedItems.push({
            hanzi,
            pinyin,
            reason: "Identical card already exists in database",
          });
        }

        userVocabularyId = existing.id;
      } else {
        // Create the user's join row for the shared entry.
        const createdJoin = await tx.userVocabulary.create({
          data: {
            userId: user.id,
            vocabularyItemId: catalogItem.id,
            deckId: deckId ?? null,
            personalMeaning:
              newMeaning === catalogItem.meaning ? null : newMeaning,
            memoryMnemonic: newMemoryMnemonic,
            personalNotes: newNotes,
            isArchived: false,
          },
          select: { id: true },
        });
        userVocabularyId = createdJoin.id;
        created += 1;
      }

      // Ensure a review card hangs off the join (in case a previous run left the
      // word without one).
      await ensureReviewCard(tx, {
        userVocabularyId,
        dueAt: now,
      });
    }
  });

  revalidatePath("/vocabulary");
  revalidatePath("/decks");

  return { created, updated, skipped, updatedItems, skippedItems };
}

function readOptionalString(formData: FormData, field: string) {
  const value = formData.get(field);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeOptional(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function getLevelId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  value: string,
) {
  const normalized = value.replace(/\s+/g, "").toUpperCase();
  const level = await tx.level.findFirst({
    where: {
      OR: [{ code: normalized }, { name: { equals: value, mode: "insensitive" } }],
    },
  });

  return level?.id ?? null;
}

async function getOrCreateDeckId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  name: string,
  userId: string,
) {
  const existing = await tx.deck.findFirst({
    where: {
      userId,
      name: {
        equals: name,
        mode: "insensitive",
      },
      isArchived: false,
    },
  });

  if (existing) {
    return existing.id;
  }

  const deck = await tx.deck.create({
    data: {
      userId,
      name,
    },
  });

  return deck.id;
}
