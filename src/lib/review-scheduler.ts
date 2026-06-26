import type { ReviewGrade } from "@prisma/client";

export type ReviewCardScheduleInput = {
  intervalDays: number;
  easeFactor: number;
  reviewCount: number;
  lapseCount: number;
};

export type ReviewScheduleResult = {
  intervalDays: number;
  easeFactor: number;
  dueAt: Date;
  reviewCount: number;
  lapseCount: number;
};

const minimumEaseFactor = 1.3;
const maximumEaseFactor = 3;
const minutesInMs = 60 * 1000;
const daysInMs = 24 * 60 * 60 * 1000;

export function scheduleReview({
  card,
  grade,
  now,
}: {
  card: ReviewCardScheduleInput;
  grade: ReviewGrade;
  now: Date;
}): ReviewScheduleResult {
  const nextReviewCount = card.reviewCount + 1;

  if (grade === "AGAIN") {
    return {
      intervalDays: 0,
      easeFactor: clampEase(card.easeFactor - 0.2),
      dueAt: addMinutes(now, 10),
      reviewCount: nextReviewCount,
      lapseCount: card.lapseCount + 1,
    };
  }

  if (grade === "HARD") {
    const intervalDays = Math.max(1, Math.round(card.intervalDays * 1.2));

    return {
      intervalDays,
      easeFactor: clampEase(card.easeFactor - 0.15),
      dueAt: addDays(now, intervalDays),
      reviewCount: nextReviewCount,
      lapseCount: card.lapseCount,
    };
  }

  if (grade === "GOOD") {
    const intervalDays = getGoodInterval(card);

    return {
      intervalDays,
      easeFactor: card.easeFactor,
      dueAt: addDays(now, intervalDays),
      reviewCount: nextReviewCount,
      lapseCount: card.lapseCount,
    };
  }

  const intervalDays =
    card.reviewCount === 0
      ? 4
      : Math.max(1, Math.round(card.intervalDays * card.easeFactor * 1.3));

  return {
    intervalDays,
    easeFactor: clampEase(card.easeFactor + 0.15),
    dueAt: addDays(now, intervalDays),
    reviewCount: nextReviewCount,
    lapseCount: card.lapseCount,
  };
}

function getGoodInterval(card: ReviewCardScheduleInput) {
  if (card.reviewCount === 0) {
    return 1;
  }

  if (card.reviewCount === 1) {
    return 3;
  }

  return Math.max(1, Math.round(card.intervalDays * card.easeFactor));
}

function clampEase(easeFactor: number) {
  return Math.min(maximumEaseFactor, Math.max(minimumEaseFactor, easeFactor));
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * minutesInMs);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * daysInMs);
}
