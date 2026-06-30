import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "./csv";

describe("csv utilities", () => {
  it("parses quoted commas and newlines", () => {
    expect(
      parseCsv(
        'hanzi,pinyin,meaning,notes\n\u5b66\u4e60,xue2 xi2,study,"line one, line two"\n',
      ),
    ).toEqual([
      {
        hanzi: "\u5b66\u4e60",
        pinyin: "xue2 xi2",
        meaning: "study",
        notes: "line one, line two",
      },
    ]);
  });

  it("parses escaped quotes and CRLF input", () => {
    expect(
      parseCsv(
        'hanzi,pinyin,meaning,notes\r\n\u8bf4,shuo1,speak,"He said ""hello""."\r\n',
      ),
    ).toEqual([
      {
        hanzi: "\u8bf4",
        pinyin: "shuo1",
        meaning: "speak",
        notes: 'He said "hello".',
      },
    ]);
  });

  it("escapes exported cells", () => {
    expect(
      toCsv([
        {
          hanzi: "\u5b66\u4e60",
          pinyin: "xue2 xi2",
          meaning: "study, learn",
        },
      ]),
    ).toBe('hanzi,pinyin,meaning\n\u5b66\u4e60,xue2 xi2,"study, learn"\n');
  });
});
