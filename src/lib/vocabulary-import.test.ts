import { describe, expect, it } from "vitest";
import {
  getVocabularyImportDuplicateKey,
  validateVocabularyImportRows,
} from "./vocabulary-import-validation";

describe("vocabulary import validation", () => {
  it("returns readable row-level errors for missing fields and unknown columns", () => {
    const result = validateVocabularyImportRows([
      {
        hanzi: "",
        pinyin: "xue2 xi2",
        meaning: "",
        extra: "ignored",
      },
    ]);

    expect(result.errors).toEqual([
      "Row 2: unknown column(s): extra.",
      "Row 2: hanzi is required.",
      "Row 2: meaning is required.",
    ]);
  });

  it("normalizes duplicate keys by deck scope and trimmed vocabulary fields", () => {
    expect(
      getVocabularyImportDuplicateKey({
        deckName: " HSK 1 ",
        hanzi: " \u5b66\u4e60 ",
        pinyin: " xue2 xi2 ",
        meaning: " study ",
      }),
    ).toBe(
      getVocabularyImportDuplicateKey({
        deckName: "hsk 1",
        hanzi: "\u5b66\u4e60",
        pinyin: "xue2 xi2",
        meaning: "study",
      }),
    );
  });

  it("keeps duplicate keys different across deck scopes", () => {
    const firstDeck = getVocabularyImportDuplicateKey({
      deckId: "deck-1",
      hanzi: "\u4f60\u597d",
      pinyin: "ni3 hao3",
      meaning: "hello",
    });
    const secondDeck = getVocabularyImportDuplicateKey({
      deckId: "deck-2",
      hanzi: "\u4f60\u597d",
      pinyin: "ni3 hao3",
      meaning: "hello",
    });

    expect(firstDeck).not.toBe(secondDeck);
  });
});
