import { describe, expect, it } from "vitest";
import {
  isActiveRecord,
  shouldShowActiveLesson,
  shouldShowDeckStudyActions,
} from "./archive-rules";

describe("archive visibility rules", () => {
  it("treats missing and archived records as inactive", () => {
    expect(isActiveRecord(null)).toBe(false);
    expect(isActiveRecord(undefined)).toBe(false);
    expect(isActiveRecord({ isArchived: true })).toBe(false);
    expect(isActiveRecord({ isArchived: false })).toBe(true);
  });

  it("shows a lesson only when both course and lesson are active", () => {
    expect(
      shouldShowActiveLesson({
        course: { isArchived: false },
        lesson: { isArchived: false },
      }),
    ).toBe(true);
    expect(
      shouldShowActiveLesson({
        course: { isArchived: true },
        lesson: { isArchived: false },
      }),
    ).toBe(false);
    expect(
      shouldShowActiveLesson({
        course: { isArchived: false },
        lesson: { isArchived: true },
      }),
    ).toBe(false);
  });

  it("hides deck study actions for archived or missing decks", () => {
    expect(shouldShowDeckStudyActions({ isArchived: false })).toBe(true);
    expect(shouldShowDeckStudyActions({ isArchived: true })).toBe(false);
    expect(shouldShowDeckStudyActions(null)).toBe(false);
  });
});
