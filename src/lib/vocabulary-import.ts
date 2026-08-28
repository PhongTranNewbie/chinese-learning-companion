"use server";

import { revalidatePath } from "next/cache";
import { parseCharacterNotesInput } from "@/lib/character-notes";
import { parseCsv } from "@/lib/csv";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  ensureOwnedReviewCard,
  findOwnedVocabularyItem,
  resolveSharedCatalogItem,
  upsertUserVocabulary,
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

      // Merge into the importing user's own row. This used to look the spelling
      // up globally, then claim an unowned row and move its deck/level - so an
      // import could take over a shared entry or another user's word.
      const existing = await findOwnedVocabularyItem(tx, {
        userId: user.id,
        hanzi,
        pinyin,
      });

      let ownedId: string;
      let reviewCardId: string | null = null;
      let finalMeaning = newMeaning;
      let finalMemoryMnemonic = newMemoryMnemonic;
      let finalNotes = newNotes;
      let finalDeckId = deckId;
      let finalSource: string | null = null;

      if (existing) {
        // UPSERT: Update existing vocabulary
        // Determine what should be updated
        const updates: Record<string, string | boolean | null> = {};
        let shouldUpdate = false;

        // Update meaning if new is longer/richer or old is empty
        if (newMeaning && (!existing.meaning || newMeaning.length > existing.meaning.length)) {
          updates.meaning = newMeaning;
          shouldUpdate = true;
        }

        // Update optional fields: new non-empty replaces empty, longer replaces shorter
        if (newPartOfSpeech && !existing.partOfSpeech) {
          updates.partOfSpeech = newPartOfSpeech;
          shouldUpdate = true;
        }

        if (newMeasureWord && !existing.measureWord) {
          updates.measureWord = newMeasureWord;
          shouldUpdate = true;
        }

        if (newExampleChinese && (!existing.exampleChinese || newExampleChinese.length > existing.exampleChinese.length)) {
          updates.exampleChinese = newExampleChinese;
          shouldUpdate = true;
        }

        if (newExamplePinyin && (!existing.examplePinyin || newExamplePinyin.length > existing.examplePinyin.length)) {
          updates.examplePinyin = newExamplePinyin;
          shouldUpdate = true;
        }

        if (newExampleEnglish && (!existing.exampleEnglish || newExampleEnglish.length > existing.exampleEnglish.length)) {
          updates.exampleEnglish = newExampleEnglish;
          shouldUpdate = true;
        }

        if (newCharacterBreakdown && (!existing.characterBreakdown || newCharacterBreakdown.length > existing.characterBreakdown.length)) {
          updates.characterBreakdown = newCharacterBreakdown;
          shouldUpdate = true;
        }

        if (newWordFormationNote && (!existing.wordFormationNote || newWordFormationNote.length > existing.wordFormationNote.length)) {
          updates.wordFormationNote = newWordFormationNote;
          shouldUpdate = true;
        }

        if (newMemoryMnemonic && (!existing.memoryMnemonic || newMemoryMnemonic.length > existing.memoryMnemonic.length)) {
          updates.memoryMnemonic = newMemoryMnemonic;
          shouldUpdate = true;
        }

        // Merge notes if both exist
        if (newNotes) {
          if (!existing.notes) {
            updates.notes = newNotes;
            shouldUpdate = true;
          } else if (!existing.notes.includes(newNotes)) {
            updates.notes = `${existing.notes}\n\n${newNotes}`;
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

        if (levelId && levelId !== existing.levelId) {
          updates.levelId = levelId;
          shouldUpdate = true;
        }

        if (characterNotes.length > 0 && existing.characterNotes.length === 0) {
          await tx.vocabularyCharacterNote.createMany({
            data: characterNotes.map((note) => ({
              ...note,
              vocabularyItemId: existing.id,
            })),
          });
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          if (Object.keys(updates).length > 0) {
            await tx.vocabularyItem.update({
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

        ownedId = existing.id;
        reviewCardId = existing.reviewCard?.id ?? null;
        finalMeaning = (updates.meaning as string | undefined) ?? existing.meaning;
        finalMemoryMnemonic =
          (updates.memoryMnemonic as string | undefined) ??
          existing.memoryMnemonic;
        finalNotes = (updates.notes as string | undefined) ?? existing.notes;
        finalDeckId = (updates.deckId as string | undefined) ?? existing.deckId;
        finalSource = existing.source;
      } else {
        // Create new vocabulary
        const createdItem = await tx.vocabularyItem.create({
          data: {
            userId: user.id,
            hanzi,
            pinyin,
            meaning: newMeaning,
            deckId,
            levelId,
            partOfSpeech: newPartOfSpeech,
            measureWord: newMeasureWord,
            exampleChinese: newExampleChinese,
            examplePinyin: newExamplePinyin,
            exampleEnglish: newExampleEnglish,
            characterBreakdown: newCharacterBreakdown,
            wordFormationNote: newWordFormationNote,
            memoryMnemonic: newMemoryMnemonic,
            notes: newNotes,
            characterNotes: {
              create: characterNotes,
            },
          },
          select: { id: true },
        });
        ownedId = createdItem.id;
        created += 1;
      }

      // This user's own learning data for the shared entry.
      const perUserData = {
        deckId: finalDeckId,
        personalMeaning:
          finalMeaning === catalogItem.meaning ? null : finalMeaning,
        memoryMnemonic: finalMemoryMnemonic,
        personalNotes: finalNotes,
        source: finalSource,
        isArchived: false,
      };
      const userVocabulary = await upsertUserVocabulary(tx, {
        userId: user.id,
        vocabularyItemId: catalogItem.id,
        create: perUserData,
        update: perUserData,
      });

      // Ensure a review card exists (in case vocabulary was created without one)
      await ensureOwnedReviewCard(tx, {
        vocabularyItemId: ownedId,
        reviewCardId,
        userVocabularyId: userVocabulary.id,
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
