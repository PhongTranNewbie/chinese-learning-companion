import { describe, expect, it } from "vitest";
import { formatPinyinForDisplay } from "./pinyin-display";

describe("formatPinyinForDisplay", () => {
  it("converts numbered pinyin syllables to tone marks", () => {
    expect(formatPinyinForDisplay("xiang1 jiao1")).toBe("xiāng jiāo");
    expect(formatPinyinForDisplay("ping2 guo3")).toBe("píng guǒ");
    expect(formatPinyinForDisplay("kan4")).toBe("kàn");
  });

  it("leaves existing tone-mark pinyin unchanged", () => {
    expect(formatPinyinForDisplay("nǐ hǎo")).toBe("nǐ hǎo");
    expect(formatPinyinForDisplay("māma")).toBe("māma");
  });
});
