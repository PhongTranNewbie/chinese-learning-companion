-- Expand step of the catalog / per-user vocabulary split.
--
-- Purely ADDITIVE: one new table, one new nullable column, plus their indexes
-- and foreign keys. There is no INSERT, UPDATE or DELETE here, so no existing
-- row is read or modified and the running app is unaffected -- it still uses
-- "VocabularyItem"."userId" and "ReviewCard"."vocabularyItemId", both of which
-- are deliberately left in place.
--
-- "ReviewCard"."userVocabularyId" is nullable *and* unique on purpose: Postgres
-- treats NULLs as distinct, so every existing card keeps NULL without colliding,
-- while the index already expresses the eventual one-card-per-UserVocabulary
-- rule. The later contract migration then only has to make the column NOT NULL
-- rather than change the relation's cardinality.
--
-- Backfilling these columns, moving the application read/write paths, and
-- creating "VocabularyItem_hanzi_pinyin_key" all belong to later phases. That
-- last one is why this migration must not be regenerated with `prisma migrate
-- dev`: the schema declares @@unique([hanzi, pinyin]) but the database must not
-- enforce it yet, and `migrate dev` would try to close that gap.

-- CreateTable
CREATE TABLE "UserVocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "deckId" TEXT,
    "personalMeaning" TEXT,
    "memoryMnemonic" TEXT,
    "personalNotes" TEXT,
    "source" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserVocabulary_vocabularyItemId_idx" ON "UserVocabulary"("vocabularyItemId");

-- CreateIndex
CREATE INDEX "UserVocabulary_deckId_idx" ON "UserVocabulary"("deckId");

-- CreateIndex
CREATE UNIQUE INDEX "UserVocabulary_userId_vocabularyItemId_key" ON "UserVocabulary"("userId", "vocabularyItemId");

-- AddForeignKey
ALTER TABLE "UserVocabulary" ADD CONSTRAINT "UserVocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabulary" ADD CONSTRAINT "UserVocabulary_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVocabulary" ADD CONSTRAINT "UserVocabulary_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ReviewCard" ADD COLUMN     "userVocabularyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCard_userVocabularyId_key" ON "ReviewCard"("userVocabularyId");

-- AddForeignKey
ALTER TABLE "ReviewCard" ADD CONSTRAINT "ReviewCard_userVocabularyId_fkey" FOREIGN KEY ("userVocabularyId") REFERENCES "UserVocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
