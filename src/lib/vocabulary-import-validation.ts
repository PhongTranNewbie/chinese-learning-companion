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
  "characterBreakdown",
  "wordFormationNote",
  "memoryMnemonic",
  "characterNotes",
  "notes",
] as const;

type ParsedImportRow = Record<string, string>;

export function validateVocabularyImportRows(rows: ParsedImportRow[]) {
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

    return {
      row,
      rowNumber,
      duplicateKey: getVocabularyImportDuplicateKey({
        hanzi: row.hanzi,
        pinyin: row.pinyin,
      }),
    };
  });

  return { errors, validRows };
}

export function getVocabularyImportDuplicateKey({
  hanzi,
  pinyin,
}: {
  deckId?: string | null;
  deckName?: string;
  hanzi?: string;
  pinyin?: string;
  meaning?: string;
}) {
  return [hanzi?.trim(), pinyin?.trim()].join("\u001f");
}