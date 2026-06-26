import { prisma } from "@/lib/db";

export async function getDashboardData(now = new Date()) {
  const { startOfToday, startOfTomorrow } = getUtcDayRange(now);

  const [
    activeVocabularyCount,
    archivedVocabularyCount,
    dueReviewCount,
    reviewsCompletedToday,
    recentReviewEvents,
    upcomingDueReviews,
    levelBreakdown,
  ] = await Promise.all([
    prisma.vocabularyItem.count({
      where: {
        isArchived: false,
      },
    }),
    prisma.vocabularyItem.count({
      where: {
        isArchived: true,
      },
    }),
    prisma.reviewCard.count({
      where: {
        status: "ACTIVE",
        dueAt: {
          lte: now,
        },
        vocabularyItem: {
          isArchived: false,
        },
      },
    }),
    prisma.reviewEvent.count({
      where: {
        reviewedAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
        reviewCard: {
          vocabularyItem: {
            isArchived: false,
          },
        },
      },
    }),
    prisma.reviewEvent.findMany({
      where: {
        reviewCard: {
          vocabularyItem: {
            isArchived: false,
          },
        },
      },
      include: {
        reviewCard: {
          include: {
            vocabularyItem: true,
          },
        },
      },
      orderBy: {
        reviewedAt: "desc",
      },
      take: 5,
    }),
    prisma.reviewCard.findMany({
      where: {
        status: "ACTIVE",
        vocabularyItem: {
          isArchived: false,
        },
      },
      include: {
        vocabularyItem: {
          include: {
            level: true,
          },
        },
      },
      orderBy: {
        dueAt: "asc",
      },
      take: 5,
    }),
    prisma.level.findMany({
      include: {
        _count: {
          select: {
            vocabularyItems: {
              where: {
                isArchived: false,
              },
            },
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ]);

  return {
    activeVocabularyCount,
    archivedVocabularyCount,
    dueReviewCount,
    reviewsCompletedToday,
    recentReviewEvents,
    upcomingDueReviews,
    levelBreakdown: levelBreakdown.filter(
      (level) => level._count.vocabularyItems > 0,
    ),
  };
}

function getUtcDayRange(now: Date) {
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  return {
    startOfToday,
    startOfTomorrow,
  };
}
