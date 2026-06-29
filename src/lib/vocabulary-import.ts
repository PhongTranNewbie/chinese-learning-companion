"use server";

import { revalidatePath } from "next/cache";
import { parseCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";

const allowedHeaders = [
  "hanzi",
  "pinyin",
  "meaning",
  "level",
  "deck",
  "partOfSpeech",
  "measureWord",
  "exampleChinese",
  "examplePinyin",
  "exampleEnglish",
  "notes",
] as const;

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

  const errors: string[] = [];
  const validRows = rows.map((row, index) => {
    const rowNumber = index + 2;
    const unknownHeaders = Object.keys(row).filter(
      (header) => !allowedHeaders.includes(header as (typeof allowedHeaders)[number]),
    );

    if (unknownHeaders.length > 0) {
      errors.push(
        `Row ${rowNumber}: unknown column(s): ${unknownHeaders.join(", ")}.`,
      );
    }

    if (!row.hanzi?.trim()) {
      errors.push(`Row ${rowNumber}: hanzi is required.`);
    }

    if (!row.pinyin?.trim()) {
      errors.push(`Row ${rowNumber}: pinyin is required.`);
    }

    if (!row.meaning?.trim()) {
      errors.push(`Row ${rowNumber}: meaning is required.`);
    }

    return { row, rowNumber };
  });

  if (errors.length > 0) {
    return { errors };
  }

  let created = 0;
  let skipped = 0;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const { row } of validRows) {
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
