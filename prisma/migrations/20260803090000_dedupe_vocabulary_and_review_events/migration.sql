-- Collapse existing duplicate vocabulary rows before enforcing uniqueness.
DO $$
DECLARE
  duplicate_group RECORD;
  survivor_id TEXT;
  dup RECORD;
  survivor_card RECORD;
  dup_card RECORD;
BEGIN
  FOR duplicate_group IN
    SELECT "hanzi", "pinyin", array_agg("id" ORDER BY "isArchived" ASC, "createdAt" ASC) AS ids
    FROM "VocabularyItem"
    GROUP BY "hanzi", "pinyin"
    HAVING count(*) > 1
  LOOP
    survivor_id := duplicate_group.ids[1];

    FOR dup IN
      SELECT *
      FROM "VocabularyItem"
      WHERE "id" = ANY(duplicate_group.ids)
        AND "id" <> survivor_id
      ORDER BY "createdAt" ASC
    LOOP
      UPDATE "VocabularyItem" survivor
      SET
        "userId" = COALESCE(survivor."userId", dup."userId"),
        "deckId" = COALESCE(survivor."deckId", dup."deckId"),
        "levelId" = COALESCE(survivor."levelId", dup."levelId"),
        "meaning" = CASE
          WHEN length(COALESCE(dup."meaning", '')) > length(COALESCE(survivor."meaning", '')) THEN dup."meaning"
          ELSE survivor."meaning"
        END,
        "partOfSpeech" = CASE
          WHEN COALESCE(survivor."partOfSpeech", '') = '' THEN dup."partOfSpeech"
          WHEN length(COALESCE(dup."partOfSpeech", '')) > length(COALESCE(survivor."partOfSpeech", '')) THEN dup."partOfSpeech"
          ELSE survivor."partOfSpeech"
        END,
        "measureWord" = CASE
          WHEN COALESCE(survivor."measureWord", '') = '' THEN dup."measureWord"
          WHEN length(COALESCE(dup."measureWord", '')) > length(COALESCE(survivor."measureWord", '')) THEN dup."measureWord"
          ELSE survivor."measureWord"
        END,
        "exampleChinese" = CASE
          WHEN COALESCE(survivor."exampleChinese", '') = '' THEN dup."exampleChinese"
          WHEN length(COALESCE(dup."exampleChinese", '')) > length(COALESCE(survivor."exampleChinese", '')) THEN dup."exampleChinese"
          ELSE survivor."exampleChinese"
        END,
        "examplePinyin" = CASE
          WHEN COALESCE(survivor."examplePinyin", '') = '' THEN dup."examplePinyin"
          WHEN length(COALESCE(dup."examplePinyin", '')) > length(COALESCE(survivor."examplePinyin", '')) THEN dup."examplePinyin"
          ELSE survivor."examplePinyin"
        END,
        "exampleEnglish" = CASE
          WHEN COALESCE(survivor."exampleEnglish", '') = '' THEN dup."exampleEnglish"
          WHEN length(COALESCE(dup."exampleEnglish", '')) > length(COALESCE(survivor."exampleEnglish", '')) THEN dup."exampleEnglish"
          ELSE survivor."exampleEnglish"
        END,
        "characterBreakdown" = CASE
          WHEN COALESCE(survivor."characterBreakdown", '') = '' THEN dup."characterBreakdown"
          WHEN length(COALESCE(dup."characterBreakdown", '')) > length(COALESCE(survivor."characterBreakdown", '')) THEN dup."characterBreakdown"
          ELSE survivor."characterBreakdown"
        END,
        "wordFormationNote" = CASE
          WHEN COALESCE(survivor."wordFormationNote", '') = '' THEN dup."wordFormationNote"
          WHEN length(COALESCE(dup."wordFormationNote", '')) > length(COALESCE(survivor."wordFormationNote", '')) THEN dup."wordFormationNote"
          ELSE survivor."wordFormationNote"
        END,
        "memoryMnemonic" = CASE
          WHEN COALESCE(survivor."memoryMnemonic", '') = '' THEN dup."memoryMnemonic"
          WHEN length(COALESCE(dup."memoryMnemonic", '')) > length(COALESCE(survivor."memoryMnemonic", '')) THEN dup."memoryMnemonic"
          ELSE survivor."memoryMnemonic"
        END,
        "notes" = CASE
          WHEN COALESCE(survivor."notes", '') = '' THEN dup."notes"
          WHEN COALESCE(dup."notes", '') = '' THEN survivor."notes"
          WHEN survivor."notes" LIKE '%' || dup."notes" || '%' THEN survivor."notes"
          ELSE survivor."notes" || E'\n\n' || dup."notes"
        END,
        "source" = COALESCE(survivor."source", dup."source"),
        "isArchived" = survivor."isArchived" AND dup."isArchived",
        "updatedAt" = NOW()
      WHERE survivor."id" = survivor_id;

      INSERT INTO "VocabularyCharacterNote" (
        "id", "vocabularyItemId", "character", "components", "componentMeanings", "mnemonicStory", "sortOrder", "createdAt", "updatedAt"
      )
      SELECT
        'cmig_' || note."id", survivor_id, note."character", note."components",
        note."componentMeanings", note."mnemonicStory", note."sortOrder", note."createdAt", note."updatedAt"
      FROM "VocabularyCharacterNote" note
      WHERE note."vocabularyItemId" = dup."id"
        AND NOT EXISTS (
          SELECT 1
          FROM "VocabularyCharacterNote" existing
          WHERE existing."vocabularyItemId" = survivor_id
            AND existing."character" = note."character"
            AND COALESCE(existing."components", '') = COALESCE(note."components", '')
            AND COALESCE(existing."componentMeanings", '') = COALESCE(note."componentMeanings", '')
            AND COALESCE(existing."mnemonicStory", '') = COALESCE(note."mnemonicStory", '')
        );

      INSERT INTO "VocabularyTag" ("vocabularyItemId", "tagId")
      SELECT survivor_id, vt."tagId"
      FROM "VocabularyTag" vt
      WHERE vt."vocabularyItemId" = dup."id"
      ON CONFLICT DO NOTHING;

      SELECT * INTO survivor_card FROM "ReviewCard" WHERE "vocabularyItemId" = survivor_id;
      SELECT * INTO dup_card FROM "ReviewCard" WHERE "vocabularyItemId" = dup."id";

      IF dup_card."id" IS NOT NULL AND survivor_card."id" IS NULL THEN
        UPDATE "ReviewCard"
        SET "vocabularyItemId" = survivor_id
        WHERE "id" = dup_card."id";
      ELSIF dup_card."id" IS NOT NULL AND survivor_card."id" IS NOT NULL THEN
        UPDATE "ReviewEvent"
        SET "reviewCardId" = survivor_card."id"
        WHERE "reviewCardId" = dup_card."id";

        UPDATE "ReviewCard" card
        SET
          "dueAt" = CASE
            WHEN dup_card."lastReviewedAt" IS NOT NULL
              AND (card."lastReviewedAt" IS NULL OR dup_card."lastReviewedAt" > card."lastReviewedAt")
            THEN dup_card."dueAt"
            ELSE card."dueAt"
          END,
          "intervalDays" = CASE
            WHEN dup_card."lastReviewedAt" IS NOT NULL
              AND (card."lastReviewedAt" IS NULL OR dup_card."lastReviewedAt" > card."lastReviewedAt")
            THEN dup_card."intervalDays"
            ELSE card."intervalDays"
          END,
          "easeFactor" = CASE
            WHEN dup_card."lastReviewedAt" IS NOT NULL
              AND (card."lastReviewedAt" IS NULL OR dup_card."lastReviewedAt" > card."lastReviewedAt")
            THEN dup_card."easeFactor"
            ELSE card."easeFactor"
          END,
          "reviewCount" = card."reviewCount" + dup_card."reviewCount",
          "lapseCount" = card."lapseCount" + dup_card."lapseCount",
          "lastReviewedAt" = CASE WHEN card."lastReviewedAt" IS NULL THEN dup_card."lastReviewedAt" WHEN dup_card."lastReviewedAt" IS NULL THEN card."lastReviewedAt" ELSE GREATEST(card."lastReviewedAt", dup_card."lastReviewedAt") END,
          "status" = CASE WHEN card."status" = 'ACTIVE' OR dup_card."status" = 'ACTIVE' THEN 'ACTIVE'::"ReviewStatus" ELSE card."status" END,
          "updatedAt" = NOW()
        WHERE card."id" = survivor_card."id";

        DELETE FROM "ReviewCard" WHERE "id" = dup_card."id";
      END IF;

      DELETE FROM "VocabularyItem" WHERE "id" = dup."id";
    END LOOP;
  END LOOP;
END $$;

-- Keep only the latest rating for each card in each review session.
DELETE FROM "ReviewEvent" old_event
USING "ReviewEvent" newer_event
WHERE old_event."reviewSessionId" IS NOT NULL
  AND newer_event."reviewSessionId" = old_event."reviewSessionId"
  AND newer_event."reviewCardId" = old_event."reviewCardId"
  AND (
    newer_event."reviewedAt" > old_event."reviewedAt"
    OR (newer_event."reviewedAt" = old_event."reviewedAt" AND newer_event."id" > old_event."id")
  );

CREATE UNIQUE INDEX "VocabularyItem_hanzi_pinyin_key" ON "VocabularyItem"("hanzi", "pinyin");
CREATE UNIQUE INDEX "ReviewEvent_reviewSessionId_reviewCardId_key" ON "ReviewEvent"("reviewSessionId", "reviewCardId");