-- Phase 5 / Migration A — data reconciliation (single transaction).
--
-- Collapses the live database to the "global catalog + per-user join" shape so
-- Migration B can enforce the schema contract. Every id and count below was
-- verified against the live database on 2026-08-29 via read-only SELECTs; the
-- final invariants are asserted in the DO block at the end, which RAISEs and
-- rolls the whole migration back if any of them fails.
--
-- Before: 95 VocabularyItem (43 catalog / 52 owned), 55 UserVocabulary,
--         91 ReviewCard (52 join-linked / 39 template), 22 ReviewEvent,
--         21 duplicate (hanzi, pinyin) groups (2 mojibake + 19 legitimate).
-- After:  64 VocabularyItem (all catalog), 47 UserVocabulary, 47 ReviewCard
--         (all join-linked), 19 ReviewEvent, 0 duplicate groups.

-- ---------------------------------------------------------------------------
-- 1. Free the legacy unique link so step 4 can point several cards at one
--    catalog item without colliding. (The column itself is dropped in
--    Migration B.)
-- ---------------------------------------------------------------------------
DROP INDEX "ReviewCard_vocabularyItemId_key";

-- ---------------------------------------------------------------------------
-- 2. Double-membership consolidation: delete the six surplus joins of the four
--    pairs (妈, 学习, 朋友, 木). Each cascades its card; all six joins/cards
--    carry zero review events, so nothing is lost. This MUST precede step 3:
--    repointing 朋友's survivor onto its canonical would otherwise collide with
--    the still-present surplus join under
--    UserVocabulary_userId_vocabularyItemId_key.
-- ---------------------------------------------------------------------------
DELETE FROM "UserVocabulary" WHERE "id" IN (
  'uv_cms92kowa000bx47ky7zcouwl',  -- 妈      (card cms92kowh, 0 events)
  'uv_cmse8fsvr00008c7kxvgbnwc5',  -- 妈      (card cmse8fsvw, 0 events)
  'uv_cms91ye810003x47k4s248dw6',  -- 学习    (cardless)
  'uv_cms92koz4000yx47k1ey75cdy',  -- 学习    (card cms92koz9, 0 events)
  'uv_cms92kp07001cx47k5hysbdbh',  -- 朋友    (cardless)
  'uv_cmse99vjp0005lo7kb5aqffva'   -- 木      (archived, cardless)
);

-- ---------------------------------------------------------------------------
-- 3. Repoint every join whose item is not the canonical of its group onto the
--    canonical. Exactly five joins move here (the five provably remaining
--    joins on non-canonical items):
--      uv_cms91ye7u   (你好) → cmqzb77bh
--      cmtbsnd99      (工作) → cms92kp24
--      cmtae05h2      (朋友) → cms92kp07   <-- the surviving join
--      cmtbsnd8g      (水)   → cms92kp1k
--      cmtbsnd59      (谢谢) → cms92kp0l
--    木's canonical is the CATALOG row cmtbnicxt (its membership is ACTIVE and
--    card-bearing), NOT the generic oldest-wins choice cmse99vjp whose join is
--    archived and cardless — that surplus join was deleted in step 2. All five
--    targets already satisfy UserVocabulary_userId_vocabularyItemId_key.
-- ---------------------------------------------------------------------------
UPDATE "UserVocabulary" SET "vocabularyItemId" = 'cmqzb77bh0003kw7kunjgyp97'
  WHERE "id" = 'uv_cms91ye7u0001x47k006c663z';
UPDATE "UserVocabulary" SET "vocabularyItemId" = 'cms92kp24001xx47k4ixeqobm'
  WHERE "id" = 'cmtbsnd99000se87kb58hrwvy';
UPDATE "UserVocabulary" SET "vocabularyItemId" = 'cms92kp07001cx47k5hysbdbh'
  WHERE "id" = 'cmtae05h20009qw7ktk921vc9';
UPDATE "UserVocabulary" SET "vocabularyItemId" = 'cms92kp1k001rx47kh2jrffn1'
  WHERE "id" = 'cmtbsnd8g000me87k6z95xc2i';
UPDATE "UserVocabulary" SET "vocabularyItemId" = 'cms92kp0l001gx47kvg67d6hs'
  WHERE "id" = 'cmtbsnd590004e87kxhax37u9';

-- ---------------------------------------------------------------------------
-- 4. Repoint every card onto its join's item so that no surviving card still
--    references a row that step 6 deletes (and fix the pre-existing card/item
--    mismatches in passing). Cards may temporarily share a vocabularyItemId;
--    that is why step 1 dropped the unique index first.
-- ---------------------------------------------------------------------------
UPDATE "ReviewCard" rc
SET "vocabularyItemId" = uv."vocabularyItemId"
FROM "UserVocabulary" uv
WHERE rc."userVocabularyId" = uv."id"
  AND rc."vocabularyItemId" IS DISTINCT FROM uv."vocabularyItemId";

-- ---------------------------------------------------------------------------
-- 5. D6 (approved): delete the four mojibake rows (hanzi = '??'). Two are
--    catalog rows (cascade 2 joins + 2 cards, 0 events); two are owned by
--    cmrbxxg with no joins/cards/events. These are disposable corrupted test
--    artifacts and their removal was explicitly approved.
-- ---------------------------------------------------------------------------
DELETE FROM "VocabularyItem" WHERE "id" IN (
  'cmtae0g7q000aqw7kataoa4jh',  -- catalog, cascades join cmtae0g82 + card cmtae0g86
  'cmtae0g8c000eqw7krlpc8h2l',  -- catalog, cascades join cmtae0g8i + card cmtae0g8l
  'cmtae0g7y000bqw7kg8hdl8pv',  -- owned by cmrbxxg, no joins/cards/events
  'cmtae0g8g000fqw7ki6sflijf'   -- owned by cmrbxxg, no joins/cards/events
);

-- ---------------------------------------------------------------------------
-- 6. Collapse the 19 legitimate duplicate groups: delete the 27 non-canonical
--    rows (8 catalog + 19 owned). All joins/cards were repointed (steps 2-4);
--    eight template cards still cascade here because they point at eight of
--    the catalog rows (each with 0 events). Remaining template cards are
--    removed in step 8.
-- ---------------------------------------------------------------------------
DELETE FROM "VocabularyItem" WHERE "id" IN (
  'cmtbsnd9o000we87kyfchvxug',  -- 买      (owned)
  'cmt7j6n7r001tv47kp76ff3g5',  -- 人      (catalog)
  'cmtbsnd70000de87k4dwci0qv',  -- 今天    (owned)
  'cmr29zq0v0000347kn49q0970',  -- 你好    (catalog)
  'cms91ye7u0001x47k006c663z',  -- 你好    (owned B)
  'cmtbnllf4000aik7kinmrk80z',  -- 你好    (owned N)
  'cmtbnlfpl0006ik7kcn925c3z',  -- 再见    (owned)
  'cmtbsnd6h0008e87k33cbs81u',  -- 喝茶    (owned)
  'cmtbsnda1000ze87kk5kqzaak',  -- 多少    (owned)
  'cms92kowa000bx47ky7zcouwl',  -- 妈      (owned B)
  'cmse8fsvr00008c7kxvgbnwc5',  -- 妈      (owned B)
  'cmqzb77bu0005kw7k2hopm1oj',  -- 学习    (catalog)
  'cms91ye810003x47k4s248dw6',  -- 学习    (owned B)
  'cms92koz4000yx47k1ey75cdy',  -- 学习    (owned B)
  'cmt7j6n6m001lv47krvjiu2b4',  -- 工作    (catalog)
  'cmtbsnd9b000te87k5bi995ei',  -- 工作    (owned)
  'cmtbsnd7j000ge87k1bupd0yt',  -- 明天    (owned)
  'cmt7j6mzg000cv47ky39gc4wt',  -- 朋友    (catalog)
  'cmse99vjp0005lo7kb5aqffva',  -- 木      (owned B)
  'cmt7j6n63001hv47k44k2xqri',  -- 水      (catalog)
  'cmtbsnd8i000ne87k6atam25s',  -- 水      (owned)
  'cmtbsnd82000ke87kb20g6vao',  -- 现在    (owned)
  'cmt7j6n3q0012v47kia5y8pb5',  -- 看      (catalog)
  'cmtbsnd8x000qe87k4swdgk69',  -- 米饭    (owned)
  'cmtadfbhf0002qw7kj32dzd7u',  -- 苹果    (owned B)
  'cmt7j6mym0008v47k7fmx035p',  -- 谢谢    (catalog)
  'cmtbsnd5c0005e87khmsra6mb'   -- 谢谢    (owned)
);

-- ---------------------------------------------------------------------------
-- 7. Convert the 31 owned survivors to catalog rows: 7 owned canonicals
--    (人, 妈, 工作, 朋友, 水, 看, 谢谢) + 24 clean singles. 木's canonical is
--    already catalog (cmtbnicxt), so it is NOT in this set.
-- ---------------------------------------------------------------------------
UPDATE "VocabularyItem" SET "userId" = NULL WHERE "id" IN (
  'cmse8n1ge000q8c7ktxcbelu9',  -- 人      (canonical)
  'cmr2aqt7h0000fg7ksshr9m6c',  -- 妈      (canonical)
  'cms92kp24001xx47k4ixeqobm',  -- 工作    (canonical)
  'cms92kp07001cx47k5hysbdbh',  -- 朋友    (canonical)
  'cms92kp1k001rx47kh2jrffn1',  -- 水      (canonical)
  'cmr29zq2g000e347kyfbpq2mt',  -- 看      (canonical)
  'cms92kp0l001gx47kvg67d6hs',  -- 谢谢    (canonical)
  'cms92kox9000jx47kzecurv7d',  -- 休
  'cms92kozj0013x47ka054bo6v',  -- 咖啡
  'cms92kowt000fx47ki69hf4my',  -- 好
  'cmse99vjd0002lo7kg06c4zlt',  -- 山
  'cms92kp2z002cx47k4037l7hw',  -- 应该
  'cmse8n1fb000f8c7k1kbf2n2q',  -- 日
  'cms92koxo000nx47kd9jjfhfm',  -- 明
  'cmse8n1fk000i8c7kocyq0hp8',  -- 月
  'cms92kp2f0022x47kqjvf69x3',  -- 汉字
  'cmse8n1gn000u8c7kko5xs408',  -- 火
  'cms92koyj000ux47ks5247ez5',  -- 爱
  'cms92kp1a001ox47k8hil86pr',  -- 猫
  'cms92kozw0018x47k11n0pfij',  -- 电脑
  'cms92koy2000qx47kz0nx232t',  -- 男
  'cmse8n1ea00048c7kbgafrkrs',  -- 花
  'cms92kp0x001jx47k7nasjk3q',  -- 苹果
  'cms92kp1t001ux47kjyauvfie',  -- 茶
  'cmse8n1f0000c8c7kgehrkucu',  -- 行 (háng)
  'cmse8n1em00088c7k4lappu65',  -- 行 (xíng)
  'cmse8n1g4000m8c7kcpgx0rxo',  -- 门
  'cmse9ih0g000blo7kmua2q0nq',  -- 雨
  'cms92kp2q0027x47klh7o7d66',  -- 音乐
  'cms92kp39002hx47krxninlcb',  -- 顺利
  'cmse9ih19000elo7kr8op7hsm'   -- 风
);

-- ---------------------------------------------------------------------------
-- 8. Delete the 39 template (deck) cards — those without a per-user join.
--    Eight already cascaded in step 6, so this removes the remaining 31; the
--    three review events that lived on template cards (学习 x2, 医生 x1) cascade
--    here, bringing ReviewEvent from 22 to 19.
-- ---------------------------------------------------------------------------
DELETE FROM "ReviewCard" WHERE "userVocabularyId" IS NULL;

-- ---------------------------------------------------------------------------
-- 9. Assert the final invariants. Any failure raises and rolls back the whole
--    migration.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_items int; v_owned int; v_joins int; v_cards int; v_nullcards int;
  v_events int; v_dup int;
  v_mu_joins int; v_mu_cards int; v_xuexi_events int;
BEGIN
  SELECT count(*) INTO v_items FROM "VocabularyItem";
  SELECT count(*) INTO v_owned FROM "VocabularyItem" WHERE "userId" IS NOT NULL;
  SELECT count(*) INTO v_joins FROM "UserVocabulary";
  SELECT count(*) INTO v_cards FROM "ReviewCard";
  SELECT count(*) INTO v_nullcards FROM "ReviewCard" WHERE "userVocabularyId" IS NULL;
  SELECT count(*) INTO v_events FROM "ReviewEvent";
  SELECT count(*) INTO v_dup
    FROM (SELECT 1 FROM "VocabularyItem" GROUP BY "hanzi", "pinyin" HAVING count(*) > 1) d;
  -- 木: the survivor join cmtbnicxx on canonical cmtbnicxt stays ACTIVE + card-bearing.
  SELECT count(*) INTO v_mu_joins FROM "UserVocabulary" uv
    JOIN "ReviewCard" rc ON rc."userVocabularyId" = uv."id"
    WHERE uv."vocabularyItemId" = 'cmtbnicxt0003ik7kj4deiexg'
      AND rc."status" = 'ACTIVE';
  SELECT count(*) INTO v_mu_cards FROM "ReviewCard" rc
    JOIN "UserVocabulary" uv ON uv."id" = rc."userVocabularyId"
    WHERE uv."vocabularyItemId" = 'cmtbnicxt0003ik7kj4deiexg';
  -- 学习: the survivor join keeps its single review event.
  SELECT count(*) INTO v_xuexi_events FROM "ReviewEvent" e
    JOIN "ReviewCard" rc ON rc."id" = e."reviewCardId"
    WHERE rc."userVocabularyId" = 'cmtae05gm0008qw7kwpw598np';

  IF v_items <> 64 OR v_owned <> 0 OR v_joins <> 47 OR v_cards <> 47
     OR v_nullcards <> 0 OR v_events <> 19 OR v_dup <> 0
     OR v_mu_joins <> 1 OR v_mu_cards <> 1 OR v_xuexi_events <> 1 THEN
    RAISE EXCEPTION
      'Phase 5 Migration A invariant failed: items=% owned=% joins=% cards=% nullcards=% events=% dup=% mu_joins=% mu_cards=% xuexi_events=%',
      v_items, v_owned, v_joins, v_cards, v_nullcards, v_events, v_dup,
      v_mu_joins, v_mu_cards, v_xuexi_events;
  END IF;
END $$;
