-- Canonicalize legacy sample pinyin ahead of the Phase 2 backfill.
--
-- The catalog currently stores the same word under two or three different pinyin
-- spellings -- numbered ("ma1 ma", "ma1 ma5"), tone-marked ("māma"), spaced and
-- capitalized variants. @@unique([hanzi, pinyin]) would happily keep all of them
-- as separate catalog rows, which satisfies the letter of "one entry per word"
-- but not the intent: two users entering the same word with different pinyin
-- conventions would never share a catalog entry. This migration settles on ONE
-- format -- Unicode tone marks, syllables joined within a word and spaced
-- between words (māma, nǐ hǎo, xuéxí) -- so that only exact duplicates remain,
-- and those collapse losslessly in Phase 5 once per-user data lives on
-- "UserVocabulary".
--
-- There is deliberately no normalization or merge *logic* here: the database
-- holds development/sample data only, so the numbered rows are simply removed
-- and re-created by the (now canonical) seed, and the handful of non-canonical
-- tone-marked spellings are corrected by name. "prisma/seed.ts" was updated in
-- the same change to emit tone marks, otherwise the next `prisma db seed` would
-- mint the numbered rows straight back.

-- Step 1: correct the non-canonical tone-marked spellings.
--
-- These are UPDATEs rather than DELETEs precisely because four of the five rows
-- are user-owned: rewriting the spelling keeps every mnemonic, note, deck link
-- and review card exactly where it is. Each statement names the exact spelling
-- it replaces, so re-running this migration matches nothing and changes nothing.
--
-- "学习" is the one case whose target already exists, which turns it into an
-- exact ("hanzi", "pinyin") duplicate of the other 学习 rows. That is intended:
-- an exact duplicate is what Phase 5 can collapse without losing anything,
-- whereas a divergent spelling would survive as a permanently conflicting
-- catalog entry.
UPDATE "VocabularyItem" SET "pinyin" = 'xuéxí',   "updatedAt" = CURRENT_TIMESTAMP WHERE "hanzi" = '学习' AND "pinyin" = 'xué xí';
UPDATE "VocabularyItem" SET "pinyin" = 'péngyou', "updatedAt" = CURRENT_TIMESTAMP WHERE "hanzi" = '朋友' AND "pinyin" = 'péng you';
UPDATE "VocabularyItem" SET "pinyin" = 'gōngzuò', "updatedAt" = CURRENT_TIMESTAMP WHERE "hanzi" = '工作' AND "pinyin" = 'gōng zuò';
UPDATE "VocabularyItem" SET "pinyin" = 'xièxie',  "updatedAt" = CURRENT_TIMESTAMP WHERE "hanzi" = '谢谢' AND "pinyin" = 'xiè xie';
UPDATE "VocabularyItem" SET "pinyin" = 'nǚ''ér',  "updatedAt" = CURRENT_TIMESTAMP WHERE "hanzi" = '女儿' AND "pinyin" = 'Nǚér';

-- Step 2: drop the legacy numbered-pinyin rows.
--
-- DESTRUCTIVE. All 49 of these rows are catalog rows produced by earlier runs of
-- the pre-canonical seed; every one has "userId" IS NULL, and the explicit guard
-- below makes it structurally impossible for this statement to touch a row a
-- user owns however the data shifts. Cascades take 49 "ReviewCard" rows, 2
-- "ReviewEvent" rows and 13 "VocabularyCharacterNote" rows with them -- all
-- likewise unowned, and all seeded review state rather than real study history.
-- ("QuizQuestion" holds no foreign key to "VocabularyItem", but that table is
-- empty, so this leaves no dangling references.)
--
-- This also sweeps out the accumulated test junk that only ever existed in
-- numbered form -- mojibake "??" / "????", "PHASE47_PRIVATE_1783509675615",
-- "复习猫2B", "展示词改", "旧词", "隐藏" -- and the numbered half of all 16
-- words that were stored in both formats. Re-seeding afterwards restores the
-- legitimate starter vocabulary in canonical form.
DELETE FROM "VocabularyItem" WHERE "pinyin" ~ '[0-9]' AND "userId" IS NULL;
