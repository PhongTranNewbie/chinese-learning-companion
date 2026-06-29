import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";

describe("csv utilities", () => {
  it("parses quoted commas and newlines", () => {
    expect(
      parseCsv('hanzi,pinyin,meaning,notes\n学习,xue2 xi2,study,"line one, line two"\n'),
    ).toEqual([
      {
        hanzi: "学习",
        pinyin: "xue2 xi2",
        meaning: "study",
        notes: "line one, line two",
      },
    ]);
  });

  it("escapes exported cells", () => {
    expect(
      toCsv([
        {
          hanzi: "学习",
          pinyin: "xue2 xi2",
          meaning: "study, learn",
        },
      ]),
    ).toBe('hanzi,pinyin,meaning\n学习,xue2 xi2,"study, learn"\n');
  });
});
