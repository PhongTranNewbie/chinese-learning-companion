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

  it("normalizes duplicate keys by trimmed hanzi and pinyin", () => {
    expect(
      getVocabularyImportDuplicateKey({
        hanzi: " \u5b66\u4e60 ",
        pinyin: " xue2 xi2 ",
      }),
    ).toBe(
      getVocabularyImportDuplicateKey({
        deckName: "different deck",
        hanzi: "\u5b66\u4e60",
        pinyin: "xue2 xi2",
        meaning: "different meaning",
      }),
    );
  });

  it("keeps duplicate keys different for different pronunciations", () => {
    const firstPronunciation = getVocabularyImportDuplicateKey({
      hanzi: "\u597d",
      pinyin: "hao3",
    });
    const secondPronunciation = getVocabularyImportDuplicateKey({
      hanzi: "\u597d",
      pinyin: "hao4",
    });

    expect(firstPronunciation).not.toBe(secondPronunciation);
  });

  it("accepts optional memory note columns", () => {
    const result = validateVocabularyImportRows([
      {
        hanzi: "\u4f60\u597d",
        pinyin: "ni3 hao3",
        meaning: "hello",
        characterBreakdown: "\u4f60 + \u597d",
        wordFormationNote: "A common greeting formed from two familiar characters.",
        memoryMnemonic: "Imagine checking that you are good.",
        characterNotes:
          "\u4f60 | \u4ebb + \u5c14 | person + you-like sound | A person points to you as a memory aid.",
      },
    ]);

    expect(result.errors).toEqual([]);
  });
});
