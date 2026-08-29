-- Phase 5 / Migration B — schema contract.
--
-- Enforces the contract that Migration A's data reconciliation made safe:
-- VocabularyItem is now a pure shared catalog, UserVocabulary owns the per-user
-- learning data, and every ReviewCard hangs off exactly one UserVocabulary.

-- Deferred from Phase 0: safe only now that no duplicate (hanzi, pinyin) rows
-- remain (Migration A step 6). With the unique index in place, this closes the
-- deliberate schema/DB divergence that has existed since the refactor began.
CREATE UNIQUE INDEX "VocabularyItem_hanzi_pinyin_key"
  ON "VocabularyItem"("hanzi", "pinyin");

-- Migration A step 8 deleted every card without a join, so the column can now
-- be required.
ALTER TABLE "ReviewCard" ALTER COLUMN "userVocabularyId" SET NOT NULL;

-- The card is owned solely by its UserVocabulary; the legacy item link is gone.
ALTER TABLE "ReviewCard" DROP CONSTRAINT "ReviewCard_vocabularyItemId_fkey";
ALTER TABLE "ReviewCard" DROP COLUMN "vocabularyItemId";

-- VocabularyItem is a pure catalog row: drop ownership and the per-user columns.
ALTER TABLE "VocabularyItem" DROP CONSTRAINT "VocabularyItem_userId_fkey";
DROP INDEX "VocabularyItem_userId_idx";
ALTER TABLE "VocabularyItem" DROP COLUMN "userId";
ALTER TABLE "VocabularyItem" DROP COLUMN "isArchived";
ALTER TABLE "VocabularyItem" DROP COLUMN "source";

-- The catalog keeps its own mnemonic/notes under the catalog prefix; per-user
-- values live on UserVocabulary.memoryMnemonic / personalNotes.
ALTER TABLE "VocabularyItem" RENAME COLUMN "memoryMnemonic" TO "catalogMnemonic";
ALTER TABLE "VocabularyItem" RENAME COLUMN "notes" TO "catalogNotes";
