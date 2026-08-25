-- Collapse duplicate seed/template vocabulary rows.
--
-- SCOPE: this migration only touches duplicate (hanzi, pinyin) groups in which
-- EVERY row has "userId" IS NULL -- i.e. catalog/template rows created by
-- re-seeding. Groups containing any owned row are skipped entirely, because
-- merging them would destroy one user's learning data (mnemonic, notes, deck
-- membership, review history) which currently has nowhere else to live. Those
-- groups are resolved losslessly once UserVocabulary exists, at which point each
-- owner's data moves to its own row instead of being merged away.
--
-- Consequently this migration does NOT create
-- "VocabularyItem_hanzi_pinyin_key". Duplicate owned rows still exist after it
-- runs, so that index would fail; it is created only after the split.
--
-- Merge rules (differ deliberately from a naive longest-string-wins):
--   * example sentence   - exampleChinese/examplePinyin/exampleEnglish are taken
--                          ATOMICALLY from a single row, so the Chinese, pinyin
--                          and English can never come from different rows and
--                          disagree. Preference order: a Chinese field that
--                          still contains multibyte characters (i.e. was not
--                          mangled to "?????" by an encoding fault), then the
--                          most complete triple, then the longest.
--   * characterBreakdown - fill-only: the survivor's value is never overwritten,
--                          because it holds a component formula ("手 + 目") that
--                          a longer prose sentence would otherwise replace.
--   * meaning, partOfSpeech, measureWord, wordFormationNote, memoryMnemonic
--                        - longest non-empty value wins.
--   * notes              - appended, skipping text already present.
--   * userId, deckId, levelId, source - first non-null wins. Since every row in
--                          scope is null-owned, "userId" can only resolve
--                          null -> null: a public row can never become owned.
--   * isArchived         - AND across the group (active if any row is active).
DO $$
DECLARE
  duplicate_group RECORD;
  survivor_id TEXT;
  dup RECORD;
  survivor_card RECORD;
  dup_card RECORD;
  best_example RECORD;
BEGIN
  FOR duplicate_group IN
    SELECT "hanzi", "pinyin", array_agg("id" ORDER BY "isArchived" ASC, "createdAt" ASC, "id" ASC) AS ids
    FROM "VocabularyItem"
    GROUP BY "hanzi", "pinyin"
    HAVING count(*) > 1
       AND count("userId") = 0
  LOOP
    survivor_id := duplicate_group.ids[1];

    -- Pick the example sentence as one indivisible unit, before any row is
    -- deleted. octet_length > length is true only when the value contains a
    -- multibyte character, which distinguishes real Chinese from "?????".
    SELECT v."exampleChinese" AS chinese, v."examplePinyin" AS pinyin, v."exampleEnglish" AS english
    INTO best_example
    FROM "VocabularyItem" v
    WHERE v."id" = ANY(duplicate_group.ids)
    ORDER BY
      (
        COALESCE(v."exampleChinese", '') <> ''
        AND octet_length(v."exampleChinese") > length(v."exampleChinese")
      ) DESC,
      (
        (COALESCE(v."exampleChinese", '') <> '')::int
        + (COALESCE(v."examplePinyin", '') <> '')::int
        + (COALESCE(v."exampleEnglish", '') <> '')::int
      ) DESC,
      (
        length(COALESCE(v."exampleChinese", ''))
        + length(COALESCE(v."examplePinyin", ''))
        + length(COALESCE(v."exampleEnglish", ''))
      ) DESC,
      (v."id" = survivor_id) DESC,
      v."id" ASC
    LIMIT 1;

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
        -- Fill-only: never replace an existing component formula with prose.
        "characterBreakdown" = CASE
          WHEN COALESCE(survivor."characterBreakdown", '') = '' THEN dup."characterBreakdown"
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
        -- Events must move BEFORE the duplicate card is deleted: ReviewEvent
        -- cascades on ReviewCard deletion.
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

    -- Apply the chosen example sentence as a unit, after the field-by-field
    -- merge above (which deliberately leaves the three example columns alone).
    UPDATE "VocabularyItem"
    SET
      "exampleChinese" = best_example.chinese,
      "examplePinyin" = best_example.pinyin,
      "exampleEnglish" = best_example.english,
      "updatedAt" = NOW()
    WHERE "id" = survivor_id;
  END LOOP;
END $$;
