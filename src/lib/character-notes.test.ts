import { describe, expect, it } from "vitest";
import { parseCharacterNotesInput, serializeCharacterNotes } from "./character-notes";

describe("character note helpers", () => {
  it("parses textarea rows into ordered character notes", () => {
    expect(
      parseCharacterNotesInput(
        "\u5988 | \u5973 + \u9a6c | woman + horse | Memory story only, not origin\n\u597d | \u5973 + \u5b50 | woman + child | A friendly memory image",
      ),
    ).toEqual([
      {
        character: "\u5988",
        components: "\u5973 + \u9a6c",
        componentMeanings: "woman + horse",
        mnemonicStory: "Memory story only, not origin",
        sortOrder: 0,
      },
      {
        character: "\u597d",
        components: "\u5973 + \u5b50",
        componentMeanings: "woman + child",
        mnemonicStory: "A friendly memory image",
        sortOrder: 1,
      },
    ]);
  });

  it("serializes notes back to the textarea and CSV format", () => {
    expect(
      serializeCharacterNotes([
        {
          character: "\u4f60",
          components: "\u4ebb + \u5c14",
          componentMeanings: "person + you-like sound",
          mnemonicStory: "A person points to you as a memory aid.",
          sortOrder: 0,
        },
      ]),
    ).toBe(
      "\u4f60 | \u4ebb + \u5c14 | person + you-like sound | A person points to you as a memory aid.",
    );
  });
});
