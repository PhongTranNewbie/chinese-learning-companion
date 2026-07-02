-- CreateTable
CREATE TABLE "VocabularyCharacterNote" (
    "id" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "components" TEXT,
    "componentMeanings" TEXT,
    "mnemonicStory" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyCharacterNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VocabularyCharacterNote_vocabularyItemId_sortOrder_idx" ON "VocabularyCharacterNote"("vocabularyItemId", "sortOrder");

-- AddForeignKey
ALTER TABLE "VocabularyCharacterNote" ADD CONSTRAINT "VocabularyCharacterNote_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
