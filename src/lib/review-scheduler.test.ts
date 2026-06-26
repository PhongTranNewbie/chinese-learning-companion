import { describe, expect, it } from "vitest";
import { scheduleReview, type ReviewCardScheduleInput } from "./review-scheduler";

const now = new Date("2026-06-26T12:00:00.000Z");

const newCard: ReviewCardScheduleInput = {
  intervalDays: 0,
  easeFactor: 2.5,
  reviewCount: 0,
  lapseCount: 0,
};

describe("scheduleReview", () => {
  it("schedules AGAIN soon and increments lapses without mutating input", () => {
    const card = { ...newCard };
    const result = scheduleReview({ card, grade: "AGAIN", now });

    expect(result).toEqual({
      intervalDays: 0,
      easeFactor: 2.3,
      dueAt: new Date("2026-06-26T12:10:00.000Z"),
      reviewCount: 1,
      lapseCount: 1,
    });
    expect(card).toEqual(newCard);
  });

  it("schedules HARD at least one day later and lowers ease", () => {
    const result = scheduleReview({
      card: {
        intervalDays: 2,
        easeFactor: 2.5,
        reviewCount: 3,
        lapseCount: 1,
      },
      grade: "HARD",
      now,
    });

    expect(result.intervalDays).toBe(2);
    expect(result.easeFactor).toBe(2.35);
    expect(result.dueAt).toEqual(new Date("2026-06-28T12:00:00.000Z"));
    expect(result.reviewCount).toBe(4);
    expect(result.lapseCount).toBe(1);
  });

  it("schedules a first GOOD review for tomorrow", () => {
    const result = scheduleReview({ card: newCard, grade: "GOOD", now });

    expect(result.intervalDays).toBe(1);
    expect(result.dueAt).toEqual(new Date("2026-06-27T12:00:00.000Z"));
    expect(result.reviewCount).toBe(1);
    expect(result.lapseCount).toBe(0);
  });

  it("schedules EASY farther out and increases ease", () => {
    const result = scheduleReview({ card: newCard, grade: "EASY", now });

    expect(result.intervalDays).toBe(4);
    expect(result.easeFactor).toBe(2.65);
    expect(result.dueAt).toEqual(new Date("2026-06-30T12:00:00.000Z"));
    expect(result.reviewCount).toBe(1);
  });

  it("clamps ease factor to the supported range", () => {
    const lowEase = scheduleReview({
      card: {
        ...newCard,
        easeFactor: 1.35,
      },
      grade: "AGAIN",
      now,
    });
    const highEase = scheduleReview({
      card: {
        ...newCard,
        intervalDays: 10,
        easeFactor: 2.95,
        reviewCount: 4,
      },
      grade: "EASY",
      now,
    });

    expect(lowEase.easeFactor).toBe(1.3);
    expect(highEase.easeFactor).toBe(3);
  });
});
