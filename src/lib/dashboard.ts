import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export async function getDashboardData(now = new Date()) {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const { startOfToday, startOfTomorrow } = getUtcDayRange(now);

  // A guest owns no vocabulary — there are no join rows to read — so the
  // dashboard is empty rather than counting the shared catalog.
  if (!userId) {
    return {
      activeVocabularyCount: 0,
      archivedVocabularyCount: 0,
      dueReviewCount: 0,
      reviewsCompletedToday: 0,
      recentReviewEvents: [],
      upcomingDueReviews: [],
      levelBreakdown: [],
    };
  }

  const [
    activeVocabularyCount,
    archivedVocabularyCount,
    dueReviewCount,
    reviewedCardsToday,
    recentReviewEvents,
    upcomingDueReviews,
    levelBreakdown,
  ] = await Promise.all([
    prisma.userVocabulary.count({
      where: {
        userId,
        isArchived: false,
      },
    }),
    prisma.userVocabulary.count({
      where: {
        userId,
        isArchived: true,
      },
    }),
    prisma.reviewCard.count({
      where: {
        status: "ACTIVE",
        dueAt: {
          lte: now,
        },
        userVocabulary: {
          userId,
          isArchived: false,
        },
      },
    }),
    prisma.reviewEvent.groupBy({
      by: ["reviewCardId"],
      where: {
        reviewedAt: {
          gte: startOfToday,
          lt: startOfTomorrow,
        },
        reviewCard: {
          userVocabulary: {
            userId,
            isArchived: false,
          },
        },
      },
    }),
    // Read scheduling history through the join, then re-shape to the old
    // "reviewCard.vocabularyItem" form so the dashboard page is untouched.
    prisma.reviewEvent.findMany({
      where: {
        reviewCard: {
          userVocabulary: {
            userId,
            isArchived: false,
          },
        },
      },
      include: {
        reviewCard: {
          include: {
            userVocabulary: {
              include: {
                vocabularyItem: true,
              },
            },
          },
        },
      },
      orderBy: {
        reviewedAt: "desc",
      },
      take: 5,
    }).then((events) =>
      events.map((event) => {
        const { userVocabulary, ...reviewCard } = event.reviewCard;
        return {
          ...event,
          reviewCard: {
            ...reviewCard,
            vocabularyItem: userVocabulary!.vocabularyItem,
          },
        };
      }),
    ),
    prisma.reviewCard.findMany({
      where: {
        status: "ACTIVE",
        userVocabulary: {
          userId,
          isArchived: false,
        },
      },
      include: {
        userVocabulary: {
          include: {
            vocabularyItem: {
              include: {
                level: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueAt: "asc",
      },
      take: 5,
    }).then((cards) =>
      cards.map((card) => {
        const { userVocabulary, ...rest } = card;
        return {
          ...rest,
          vocabularyItem: userVocabulary!.vocabularyItem,
        };
      }),
    ),
    prisma.level.findMany({
      include: {
        _count: {
          select: {
            // Level lives on the shared catalog row, so count catalog items
            // that have a join row for this user.
            vocabularyItems: {
              where: {
                userVocabularies: {
                  some: {
                    userId,
                    isArchived: false,
                  },
                },
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
    reviewsCompletedToday: reviewedCardsToday.length,
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
  startOfTomorrow.setUTCDate(startOfToday.getUTCDate() + 1);

  return {
    startOfToday,
    startOfTomorrow,
  };
}
