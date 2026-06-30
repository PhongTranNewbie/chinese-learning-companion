"use server";

import { revalidatePath } from "next/cache";
import { parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";
import { validateVocabularyImportRows } from "@/lib/vocabulary-import-validation";

export type ImportState = {
  created?: number;
  skipped?: number;
  errors?: string[];
};

export async function importVocabularyCsv(
  _previousState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const file = formData.get("csv");
  const defaultDeckId = readOptionalString(formData, "deckId");

  if (!(file instanceof File) || file.size === 0) {
    return { errors: ["Choose a CSV file to import."] };
  }

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
  let skipped = 0;
  const now = new Date();
  const seenRows = new Set<string>();

  await prisma.$transaction(async (tx) => {
    for (const { row, duplicateKey } of validRows) {
      if (seenRows.has(duplicateKey)) {
        skipped += 1;
        continue;
      }
      seenRows.add(duplicateKey);

      const deckId = row.deck?.trim()
        ? await getOrCreateDeckId(tx, row.deck.trim())
        : defaultDeckId;
      const levelId = row.level?.trim()
        ? await getLevelId(tx, row.level.trim())
        : null;

      const duplicate = await tx.vocabularyItem.findFirst({
        where: {
          isArchived: false,
          deckId,
          hanzi: row.hanzi.trim(),
          pinyin: row.pinyin.trim(),
          meaning: row.meaning.trim(),
        },
      });

      if (duplicate) {
        skipped += 1;
        continue;
      }

      await tx.vocabularyItem.create({
        data: {
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
          notes: normalizeOptional(row.notes),
          reviewCard: {
            create: {
              dueAt: now,
            },
          },
        },
      });
      created += 1;
    }
  });

  revalidatePath("/vocabulary");
  revalidatePath("/decks");

  return { created, skipped };
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
) {
  const existing = await tx.deck.findFirst({
    where: {
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
      name,
    },
  });

  return deck.id;
}
