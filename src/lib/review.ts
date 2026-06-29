"use server";

import type { ReviewGrade } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { scheduleReview } from "@/lib/review-scheduler";

const reviewGrades = ["AGAIN", "HARD", "GOOD", "EASY"] as const;

export async function submitReview(formData: FormData) {
  const reviewCardId = readString(formData, "reviewCardId");
  const grade = readString(formData, "grade");
  const deckId = readString(formData, "deckId");

  if (!reviewCardId || !isReviewGrade(grade)) {
    return;
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const reviewCard = await tx.reviewCard.findFirst({
      where: {
        id: reviewCardId,
        status: "ACTIVE",
        vocabularyItem: {
          isArchived: false,
        },
      },
    });

    if (!reviewCard) {
      return;
    }

    const nextSchedule = scheduleReview({
      card: {
        intervalDays: reviewCard.intervalDays,
        easeFactor: reviewCard.easeFactor,
        reviewCount: reviewCard.reviewCount,
        lapseCount: reviewCard.lapseCount,
      },
      grade,
      now,
    });

    await tx.reviewEvent.create({
      data: {
        reviewCardId: reviewCard.id,
        grade,
        previousDueAt: reviewCard.dueAt,
        nextDueAt: nextSchedule.dueAt,
        previousInterval: reviewCard.intervalDays,
        nextInterval: nextSchedule.intervalDays,
        previousEase: reviewCard.easeFactor,
        nextEase: nextSchedule.easeFactor,
        reviewedAt: now,
      },
    });

    await tx.reviewCard.update({
      where: {
        id: reviewCard.id,
      },
      data: {
        intervalDays: nextSchedule.intervalDays,
        easeFactor: nextSchedule.easeFactor,
        dueAt: nextSchedule.dueAt,
        reviewCount: nextSchedule.reviewCount,
        lapseCount: nextSchedule.lapseCount,
        lastReviewedAt: now,
        status: "ACTIVE",
      },
    });
  });

  revalidatePath("/review");
  if (deckId) {
    revalidatePath(`/decks/${deckId}/study`);
    revalidatePath(`/decks/${deckId}`);
  }
}

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function isReviewGrade(value: string): value is ReviewGrade {
  return reviewGrades.includes(value as ReviewGrade);
}
