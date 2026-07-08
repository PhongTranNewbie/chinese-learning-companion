-- CreateTable
CREATE TABLE "UserStudyPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dailyReviewGoal" INTEGER NOT NULL DEFAULT 10,
    "reviewSessionSize" INTEGER NOT NULL DEFAULT 10,
    "deckStudySessionSize" INTEGER NOT NULL DEFAULT 12,
    "showMemoryAidOnReveal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStudyPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStudyPreference_userId_key" ON "UserStudyPreference"("userId");

-- AddForeignKey
ALTER TABLE "UserStudyPreference" ADD CONSTRAINT "UserStudyPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;