-- Phase 2: backfill "UserVocabulary" from the owned "VocabularyItem" rows.
--
-- Phase 1 created the table and the nullable "ReviewCard"."userVocabularyId"
-- link but left both empty. This migration populates them, so that every piece
-- of per-user learning data has a home on the new side of the split before
-- Phase 3/4 move the application's read and write paths over.
--
-- Still a parallel-change step: "VocabularyItem"."userId", its per-user columns
-- and "ReviewCard"."vocabularyItemId" are all left exactly as they are, so the
-- running app -- which reads only those -- is unaffected. Phase 5 drops them.
--
-- Both statements are written to be re-runnable: the INSERT skips items that
-- already have a join row, and the UPDATE only fills cards whose link is still
-- NULL. Running this migration twice changes nothing the second time.

-- Step 1: one "UserVocabulary" per owned catalog row.
--
-- Rows with "userId" IS NULL are the shared catalog/starter entries and get no
-- join row: nobody has studied them yet. Copying rather than moving is what
-- keeps this phase non-destructive -- the source columns stay readable until
-- Phase 5.
--
-- "notes" lands in "personalNotes" (a person's own annotation, not catalog
-- data), while "meaning" deliberately does NOT populate "personalMeaning":
-- today's meanings came from the shared catalog, not from the user overriding
-- them, so seeding an override for all 37 rows would invent an intent nobody
-- expressed. "personalMeaning" stays NULL until a user actually sets one.
--
-- "id" is generated in SQL rather than by Prisma, so these are not cuids. Ids
-- are opaque and never parsed, and the same convention was already used by the
-- Phase 0 character-note re-insert.
INSERT INTO "UserVocabulary" (
    "id", "userId", "vocabularyItemId", "deckId",
    "memoryMnemonic", "personalNotes", "source", "isArchived",
    "createdAt", "updatedAt"
)
SELECT
    'uv_' || v."id",
    v."userId",
    v."id",
    v."deckId",
    v."memoryMnemonic",
    v."notes",
    v."source",
    v."isArchived",
    v."createdAt",
    CURRENT_TIMESTAMP
FROM "VocabularyItem" v
WHERE v."userId" IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM "UserVocabulary" uv
      WHERE uv."userId" = v."userId" AND uv."vocabularyItemId" = v."id"
  );

-- Step 2: point each existing review card at its new "UserVocabulary".
--
-- The card keeps "vocabularyItemId" as well; both links coexist for the rest of
-- the refactor. Cards belonging to unowned catalog rows have no user and so
-- keep "userVocabularyId" NULL -- which the nullable unique index permits,
-- since Postgres treats NULLs as distinct.
--
-- No scheduling state is touched: "dueAt", "intervalDays", "easeFactor",
-- "reviewCount", "lapseCount" and "lastReviewedAt" are untouched, so SRS
-- behaviour and every "ReviewEvent" chain carry over exactly as they are.
--
-- The join is scoped to the *item's own* owner rather than matching on
-- "vocabularyItemId" alone. Today that is the same thing -- one owner per item,
-- so exactly one candidate -- but the whole point of this refactor is that a
-- catalog item will soon have several "UserVocabulary" rows, and an unscoped
-- join would then silently attach the existing card to an arbitrary user's row.
-- Scoping by owner keeps the statement deterministic once that day arrives.
UPDATE "ReviewCard" c
SET "userVocabularyId" = uv."id",
    "updatedAt" = CURRENT_TIMESTAMP
FROM "UserVocabulary" uv
JOIN "VocabularyItem" v
  ON v."id" = uv."vocabularyItemId"
 AND v."userId" = uv."userId"
WHERE uv."vocabularyItemId" = c."vocabularyItemId"
  AND c."userVocabularyId" IS NULL;
