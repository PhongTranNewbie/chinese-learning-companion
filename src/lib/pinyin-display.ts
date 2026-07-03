export function formatPinyinForDisplay(pinyin: string) {
  return pinyin
    .split(/(\s+)/)
    .map((part) => convertNumberedPinyinSyllable(part))
    .join("");
}

function convertNumberedPinyinSyllable(part: string) {
  const match = part.match(/^([A-Za-züÜvV:]+)([1-5])([,.;:!?]*)$/);

  if (!match) {
    return part;
  }

  const [, rawSyllable, toneText, punctuation] = match;
  const tone = Number(toneText);
  const syllable = rawSyllable
    .replace(/u:/gi, "ü")
    .replace(/v/g, "ü")
    .replace(/V/g, "Ü");

  if (tone === 5) {
    return `${syllable}${punctuation}`;
  }

  const markIndex = getPinyinToneMarkIndex(syllable);

  if (markIndex === -1) {
    return part;
  }

  return `${syllable.slice(0, markIndex)}${markPinyinVowel(
    syllable[markIndex],
    tone,
  )}${syllable.slice(markIndex + 1)}${punctuation}`;
}

function getPinyinToneMarkIndex(syllable: string) {
  const lowerSyllable = syllable.toLocaleLowerCase();

  for (const vowel of ["a", "e"]) {
    const index = lowerSyllable.indexOf(vowel);

    if (index !== -1) {
      return index;
    }
  }

  const ouIndex = lowerSyllable.indexOf("ou");

  if (ouIndex !== -1) {
    return ouIndex;
  }

  for (let index = lowerSyllable.length - 1; index >= 0; index -= 1) {
    if ("aeiouü".includes(lowerSyllable[index])) {
      return index;
    }
  }

  return -1;
}

function markPinyinVowel(vowel: string, tone: number) {
  const toneMarks: Record<string, string[]> = {
    a: ["a", "ā", "á", "ǎ", "à"],
    e: ["e", "ē", "é", "ě", "è"],
    i: ["i", "ī", "í", "ǐ", "ì"],
    o: ["o", "ō", "ó", "ǒ", "ò"],
    u: ["u", "ū", "ú", "ǔ", "ù"],
    ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
  };
  const lowerVowel = vowel.toLocaleLowerCase();
  const markedVowel = toneMarks[lowerVowel]?.[tone] ?? vowel;

  return vowel === lowerVowel ? markedVowel : markedVowel.toLocaleUpperCase();
}
