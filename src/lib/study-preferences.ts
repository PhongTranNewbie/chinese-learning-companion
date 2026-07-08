import { prisma } from "@/lib/db";

export const defaultStudyPreferences = {
  dailyReviewGoal: 10,
  reviewSessionSize: 10,
  deckStudySessionSize: 12,
  showMemoryAidOnReveal: true,
};

export type StudyPreferences = typeof defaultStudyPreferences;

export async function getStudyPreferences(userId: string | null) {
  if (!userId) {
    return defaultStudyPreferences;
  }

  const preferences = await prisma.userStudyPreference.findUnique({
    where: {
      userId,
    },
    select: {
      dailyReviewGoal: true,
      reviewSessionSize: true,
      deckStudySessionSize: true,
      showMemoryAidOnReveal: true,
    },
  });

  return preferences ?? defaultStudyPreferences;
}

export function clampPreferenceNumber(
  value: FormDataEntryValue | null,
  fallback: number,
) {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(50, Math.max(1, parsed));
}