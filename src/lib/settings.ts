"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  clampPreferenceNumber,
  defaultStudyPreferences,
} from "@/lib/study-preferences";

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function updateDisplayName(formData: FormData) {
  const user = await requireCurrentUser();
  const name = readString(formData, "name");

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name: name || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  redirect("/settings?profile=updated");
}

export async function updateStudyPreferences(formData: FormData) {
  const user = await requireCurrentUser();
  const dailyReviewGoal = clampPreferenceNumber(
    formData.get("dailyReviewGoal"),
    defaultStudyPreferences.dailyReviewGoal,
  );
  const reviewSessionSize = clampPreferenceNumber(
    formData.get("reviewSessionSize"),
    defaultStudyPreferences.reviewSessionSize,
  );
  const deckStudySessionSize = clampPreferenceNumber(
    formData.get("deckStudySessionSize"),
    defaultStudyPreferences.deckStudySessionSize,
  );
  const showMemoryAidOnReveal = formData.get("showMemoryAidOnReveal") === "on";

  await prisma.userStudyPreference.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      dailyReviewGoal,
      reviewSessionSize,
      deckStudySessionSize,
      showMemoryAidOnReveal,
    },
    update: {
      dailyReviewGoal,
      reviewSessionSize,
      deckStudySessionSize,
      showMemoryAidOnReveal,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/review");
  revalidatePath("/decks/[id]/study", "page");
  redirect("/settings?preferences=updated");
}