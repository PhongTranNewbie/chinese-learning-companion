"use server";

import { revalidatePath } from "next/cache";
import { parseCharacterNotesInput } from "@/lib/character-notes";
import { parseCsv } from "@/lib/csv";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
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

      const deckId = row.deck?.trim()
        ? await getOrCreateDeckId(tx, row.deck.trim(), user.id)
        : defaultDeckId;
      const levelId = row.level?.trim()
        ? await getLevelId(tx, row.level.trim())
        : null;

      const existing = await tx.vocabularyItem.findUnique({
        where: {
          hanzi_pinyin: {
            hanzi: row.hanzi.trim(),
            pinyin: row.pinyin.trim(),
          },
        },
        include: {
          reviewCard: true,
          characterNotes: true,
        },
      });

      if (existing) {
        // UPSERT: Update existing vocabulary
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

        if (!existing.userId) {
          updates.userId = user.id;
          shouldUpdate = true;
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

        const characterNotes = parseCharacterNotesInput(row.characterNotes);
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
          hanzi: row.hanzi.trim(),
          pinyin: row.pinyin.trim(),
          reason: "Updated existing card details",
        });
        } else {
          skipped += 1;
          skippedItems.push({
          hanzi: row.hanzi.trim(),
          pinyin: row.pinyin.trim(),
          reason: "Identical card already exists in database",
        });
        }

        // Ensure review card exists (in case vocabulary was created without one)
        if (!existing.reviewCard) {
          await tx.reviewCard.create({
            data: {
              vocabularyItemId: existing.id,
              dueAt: now,
            },
          });
        }
      } else {
        // Create new vocabulary
        await tx.vocabularyItem.create({
          data: {
            userId: user.id,
            hanzi: row.hanzi.trim(),
            pinyin: row.pinyin.trim(),
            meaning: row.meaning.trim(),
            deckId,
            levelId,
            partOfSpeech: normalizeOptional(row.partOfSpeech),
            measureWord: normalizeOptional(row.measureWord),
            exampleChinese: normalizeOptional(row.exampleChinese),
            examplePinyin: normalizeOptional(row.examplePinyin),
            exampleEnglish: normalizeOptional(row.exampleEnglish),
            characterBreakdown: normalizeOptional(row.characterBreakdown),
            wordFormationNote: normalizeOptional(row.wordFormationNote),
            memoryMnemonic: normalizeOptional(row.memoryMnemonic),
            notes: normalizeOptional(row.notes),
            characterNotes: {
              create: parseCharacterNotesInput(row.characterNotes),
            },
            reviewCard: {
              create: {
                dueAt: now,
              },
            },
          },
        });
        created += 1;
      }
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
