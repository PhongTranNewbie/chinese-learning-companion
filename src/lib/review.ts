"use server";

import type { ReviewGrade } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { scheduleReview } from "@/lib/review-scheduler";

const reviewGrades = ["AGAIN", "HARD", "GOOD", "EASY"] as const;

export async function submitReview(formData: FormData) {
  const user = await requireCurrentUser();
  const reviewCardId = readString(formData, "reviewCardId");
  const reviewSessionId = readString(formData, "reviewSessionId");
  const grade = readString(formData, "grade");
  const deckId = readString(formData, "deckId");

  if (!reviewCardId || !reviewSessionId || !isReviewGrade(grade)) {
    return;
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const existingSession = await tx.reviewSession.findUnique({
      where: {
        id: reviewSessionId,
      },
      select: {
        userId: true,
      },
    });

    if (existingSession && existingSession.userId !== user.id) {
      return;
    }

    if (!existingSession) {
      await tx.reviewSession.create({
        data: {
          id: reviewSessionId,
          userId: user.id,
        },
      });
    }

    const reviewCard = await tx.reviewCard.findFirst({
      where: {
        id: reviewCardId,
        status: "ACTIVE",
        vocabularyItem: {
          userId: user.id,
          isArchived: false,
        },
      },
    });

    if (!reviewCard) {
      return;
    }

    const existingEvent = await tx.reviewEvent.findUnique({
      where: {
        reviewSessionId_reviewCardId: {
          reviewSessionId,
          reviewCardId: reviewCard.id,
        },
      },
    });

    const baselineCard = existingEvent
      ? {
          intervalDays: existingEvent.previousInterval,
          easeFactor: existingEvent.previousEase,
          reviewCount: Math.max(0, reviewCard.reviewCount - 1),
          lapseCount: Math.max(
            0,
            reviewCard.lapseCount - (existingEvent.grade === "AGAIN" ? 1 : 0),
          ),
        }
      : {
          intervalDays: reviewCard.intervalDays,
          easeFactor: reviewCard.easeFactor,
          reviewCount: reviewCard.reviewCount,
          lapseCount: reviewCard.lapseCount,
        };

    const previousDueAt = existingEvent?.previousDueAt ?? reviewCard.dueAt;
    const nextSchedule = scheduleReview({
      card: baselineCard,
      grade,
      now,
    });

    await tx.reviewEvent.upsert({
      where: {
        reviewSessionId_reviewCardId: {
          reviewSessionId,
          reviewCardId: reviewCard.id,
        },
      },
      create: {
        reviewCardId: reviewCard.id,
        reviewSessionId,
        grade,
        previousDueAt,
        nextDueAt: nextSchedule.dueAt,
        previousInterval: baselineCard.intervalDays,
        nextInterval: nextSchedule.intervalDays,
        previousEase: baselineCard.easeFactor,
        nextEase: nextSchedule.easeFactor,
        reviewedAt: now,
      },
      update: {
        grade,
        nextDueAt: nextSchedule.dueAt,
        nextInterval: nextSchedule.intervalDays,
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

  revalidatePath("/");
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