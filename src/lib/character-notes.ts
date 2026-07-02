export type CharacterNoteInput = {
  character: string;
  components: string | null;
  componentMeanings: string | null;
  mnemonicStory: string | null;
  sortOrder: number;
};

type SerializableCharacterNote = {
  character: string;
  components: string | null;
  componentMeanings: string | null;
  mnemonicStory: string | null;
  sortOrder: number;
};

export function parseCharacterNotesInput(input: string | null | undefined) {
  if (!input?.trim()) {
    return [];
  }

  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [character = "", components = "", componentMeanings = "", mnemonicStory = ""] =
        line.split("|").map((part) => part.trim());

      return {
        character,
        components: normalizeOptional(components),
        componentMeanings: normalizeOptional(componentMeanings),
        mnemonicStory: normalizeOptional(mnemonicStory),
        sortOrder: index,
      };
    })
    .filter((note) => note.character.length > 0);
}

export function serializeCharacterNotes(notes: SerializableCharacterNote[]) {
  return [...notes]
    .sort((first, second) => first.sortOrder - second.sortOrder)
    .map((note) =>
      [
        note.character,
        note.components ?? "",
        note.componentMeanings ?? "",
        note.mnemonicStory ?? "",
      ].join(" | "),
    )
    .join("\n");
}

function normalizeOptional(value: string) {
  return value.length > 0 ? value : null;
}
