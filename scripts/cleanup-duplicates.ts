/**
 * Phase 0 read-only duplicate reporter.
 *
 * This script performs NO writes. It answers two questions before the Phase 0
 * dedupe migrations are applied:
 *
 *   1. What does the duplicate landscape look like, classified by owner shape?
 *        Class A - every row in the group has userId = null (seed/template rows)
 *        Class B - exactly one distinct non-null userId
 *        Class C - two or more distinct non-null userIds
 *      Phase 0 merges class A only. B and C are resolved losslessly in Phase 2,
 *      once UserVocabulary exists to hold each owner's learning data.
 *
 *   2. For every class-A group, exactly which values would a merge discard?
 *      That per-group diff is the sign-off gate for running the migration.
 *
 * The merge simulated here mirrors the migration statement for statement:
 * the example sentence is chosen atomically from one row, characterBreakdown is
 * fill-only, remaining scalars take the longest non-empty value, notes are
 * appended, and review cards are re-pointed with their counters summed.
 *
 * Superseded in Phase 5; deleted then.
 */
import "dotenv/config";
import type { ReviewStatus } from "@prisma/client";
import { prisma } from "../src/lib/db";

type AuditSummary = {
  total_items: number;
  null_owner_items: number;
  dup_groups: number;
  rows_a_full_merge_would_delete: number;
  class_a_null_only: number;
  class_b_single_owner: number;
  class_c_cross_user: number;
  dup_review_event_pairs: number;
};

type GroupRow = Awaited<ReturnType<typeof getGroupRows>>[number];

async function reportDuplicates() {
  console.log("Phase 0 duplicate audit (read-only)\n");

  await reportAuditSummary();

  const duplicateGroups = await prisma.vocabularyItem.groupBy({
    by: ["hanzi", "pinyin"],
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
    orderBy: [{ hanzi: "asc" }, { pinyin: "asc" }],
  });

  if (duplicateGroups.length === 0) {
    console.log("No duplicate (hanzi, pinyin) groups found. Nothing to merge.");
    return;
  }

  const skipped: string[] = [];
  let classACount = 0;
  let classARowsDeleted = 0;

  for (const group of duplicateGroups) {
    const rows = await getGroupRows(group.hanzi, group.pinyin);
    const owners = [
      ...new Set(
        rows.map((row) => row.userId).filter((id): id is string => id !== null),
      ),
    ];
    const label = `${group.hanzi} / ${group.pinyin}`;

    if (owners.length > 0) {
      const className = owners.length === 1 ? "B" : "C";
      skipped.push(
        `  [class ${className}] ${label} - ${rows.length} rows, ${owners.length} owner(s), ` +
          `${rows.filter((row) => row.userId === null).length} null-owned`,
      );
      continue;
    }

    classACount += 1;
    classARowsDeleted += rows.length - 1;
    reportClassAGroup(label, rows);
  }

  if (skipped.length > 0) {
    console.log("Groups Phase 0 will NOT touch (resolved in Phase 2):");
    for (const line of skipped) {
      console.log(line);
    }
    console.log("");
  }

  console.log("Phase 0 merge scope");
  console.log(`  class-A groups to merge:  ${classACount}`);
  console.log(`  rows to be deleted:       ${classARowsDeleted}`);
  console.log(`  groups left untouched:    ${skipped.length}`);
  console.log(
    "\nNo changes were made. Review the discarded values above before applying the migration.",
  );
}

async function reportAuditSummary() {
  const [summary] = await prisma.$queryRaw<AuditSummary[]>`
    WITH g AS (
      SELECT "hanzi", "pinyin",
             count(*)::int                                                     AS n,
             count(DISTINCT "userId") FILTER (WHERE "userId" IS NOT NULL)::int  AS distinct_users
      FROM "VocabularyItem" GROUP BY 1, 2
    ), d AS (SELECT * FROM g WHERE n > 1)
    SELECT
      (SELECT count(*)::int FROM "VocabularyItem")                        AS total_items,
      (SELECT count(*)::int FROM "VocabularyItem" WHERE "userId" IS NULL) AS null_owner_items,
      (SELECT count(*)::int FROM d)                                       AS dup_groups,
      (SELECT COALESCE(sum(n - 1), 0)::int FROM d)                        AS rows_a_full_merge_would_delete,
      (SELECT count(*)::int FROM d WHERE distinct_users = 0)              AS class_a_null_only,
      (SELECT count(*)::int FROM d WHERE distinct_users = 1)              AS class_b_single_owner,
      (SELECT count(*)::int FROM d WHERE distinct_users > 1)              AS class_c_cross_user,
      (SELECT count(*)::int FROM (
         SELECT 1 FROM "ReviewEvent" WHERE "reviewSessionId" IS NOT NULL
         GROUP BY "reviewSessionId", "reviewCardId" HAVING count(*) > 1) x) AS dup_review_event_pairs
  `;

  console.log("Audit summary");
  console.log(`  total vocabulary rows:        ${summary.total_items}`);
  console.log(`  null-owned (catalog/seed):    ${summary.null_owner_items}`);
  console.log(`  duplicate groups:             ${summary.dup_groups}`);
  console.log(
    `  rows a FULL merge would drop: ${summary.rows_a_full_merge_would_delete}`,
  );
  console.log(`  class A (null-owned only):    ${summary.class_a_null_only}`);
  console.log(`  class B (single owner):       ${summary.class_b_single_owner}`);
  console.log(`  class C (cross-user):         ${summary.class_c_cross_user}`);
  console.log(
    `  duplicate review-event pairs: ${summary.dup_review_event_pairs}`,
  );
  console.log("");
}

/**
 * Ordered exactly like the migration's survivor selection
 * (isArchived ASC, createdAt ASC, id ASC), so rows[0] is the survivor.
 */
async function getGroupRows(hanzi: string, pinyin: string) {
  return prisma.vocabularyItem.findMany({
    where: {
      hanzi,
      pinyin,
    },
    include: {
      reviewCard: true,
      characterNotes: true,
      tags: true,
    },
    orderBy: [{ isArchived: "asc" }, { createdAt: "asc" }, { id: "asc" }],
  });
}

function reportClassAGroup(label: string, rows: GroupRow[]) {
  const [survivor, ...duplicates] = rows;

  if (!survivor || duplicates.length === 0) {
    return;
  }

  console.log(`[class A] ${label} - ${rows.length} rows`);
  console.log(`  survivor:  ${survivor.id} (createdAt ${iso(survivor.createdAt)})`);
  console.log(
    `  to delete: ${duplicates.map((row) => row.id).join(", ")}`,
  );

  const discards: string[] = [];

  reportExampleTriple(discards, rows, survivor);

  // The migration merges duplicates into the survivor one at a time, in
  // createdAt order, so the running value is what each step compares against.
  // The three example* fields and characterBreakdown are deliberately absent:
  // they follow their own rules, handled above and below.
  const running: Record<string, string | null> = {
    meaning: survivor.meaning,
    partOfSpeech: survivor.partOfSpeech,
    measureWord: survivor.measureWord,
    wordFormationNote: survivor.wordFormationNote,
    memoryMnemonic: survivor.memoryMnemonic,
  };
  let runningBreakdown = survivor.characterBreakdown;
  let runningNotes = survivor.notes;
  let runningDeckId = survivor.deckId;
  let runningLevelId = survivor.levelId;
  let runningSource = survivor.source;

  const byCreatedAt = [...duplicates].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );

  for (const duplicate of byCreatedAt) {
    for (const field of Object.keys(running)) {
      const current = running[field] ?? null;
      const incoming = readField(duplicate, field);
      const winner = richer(current, incoming);

      if (winner === current && incoming?.trim() && incoming !== current) {
        discards.push(`${field}: dropping ${quote(incoming)} (keeping ${quote(current)})`);
      } else if (winner === incoming && current?.trim() && incoming !== current) {
        discards.push(`${field}: dropping ${quote(current)} (taking ${quote(incoming)})`);
      }

      running[field] = winner;
    }

    // Fill-only, so a component formula ("手 + 目") is never replaced by a
    // longer prose sentence.
    if (!runningBreakdown?.trim()) {
      if (duplicate.characterBreakdown?.trim()) {
        discards.push(
          `characterBreakdown: adopting ${quote(duplicate.characterBreakdown)} (survivor had none)`,
        );
        runningBreakdown = duplicate.characterBreakdown;
      }
    } else if (
      duplicate.characterBreakdown?.trim() &&
      duplicate.characterBreakdown !== runningBreakdown
    ) {
      discards.push(
        `characterBreakdown: dropping ${quote(duplicate.characterBreakdown)} ` +
          `(keeping ${quote(runningBreakdown)} - fill-only)`,
      );
    }

    const mergedNotes = mergeNotes(runningNotes, duplicate.notes);
    if (mergedNotes !== runningNotes && runningNotes?.trim()) {
      discards.push(`notes: appending ${quote(duplicate.notes)} to existing notes`);
    }
    runningNotes = mergedNotes;

    runningDeckId = reportCoalesce(
      discards,
      "deckId",
      runningDeckId,
      duplicate.deckId,
    );
    runningLevelId = reportCoalesce(
      discards,
      "levelId",
      runningLevelId,
      duplicate.levelId,
    );
    runningSource = reportCoalesce(
      discards,
      "source",
      runningSource,
      duplicate.source,
    );

    const newNotes = duplicate.characterNotes.filter(
      (note) =>
        !survivor.characterNotes.some(
          (existing) =>
            existing.character === note.character &&
            (existing.components ?? "") === (note.components ?? "") &&
            (existing.componentMeanings ?? "") ===
              (note.componentMeanings ?? "") &&
            (existing.mnemonicStory ?? "") === (note.mnemonicStory ?? ""),
        ),
    );
    if (duplicate.characterNotes.length > 0) {
      discards.push(
        `characterNotes: ${newNotes.length} copied to survivor, ` +
          `${duplicate.characterNotes.length - newNotes.length} skipped as identical`,
      );
    }
    if (duplicate.tags.length > 0) {
      discards.push(`tags: ${duplicate.tags.length} re-pointed to survivor`);
    }

    reportCardMerge(discards, survivor.reviewCard, duplicate.reviewCard);
  }

  if (discards.length === 0) {
    console.log("  discards:  none - duplicate rows are field-identical");
  } else {
    console.log("  merge effects:");
    for (const line of discards) {
      console.log(`    - ${line}`);
    }
  }

  const finalArchived = rows.every((row) => row.isArchived);
  if (survivor.isArchived !== finalArchived) {
    console.log(
      `    - isArchived: ${survivor.isArchived} -> ${finalArchived} (AND across group)`,
    );
  }

  console.log("");
}

/**
 * The example sentence is chosen as one indivisible unit, so its Chinese,
 * pinyin and English can never come from different rows and disagree.
 * Mirrors the migration's ORDER BY exactly.
 */
function reportExampleTriple(
  discards: string[],
  rows: GroupRow[],
  survivor: GroupRow,
) {
  const ranked = [...rows].sort((a, b) => {
    const byIntact = Number(hasIntactChinese(b)) - Number(hasIntactChinese(a));
    if (byIntact !== 0) return byIntact;

    const byFilled = exampleFilledCount(b) - exampleFilledCount(a);
    if (byFilled !== 0) return byFilled;

    const byLength = exampleTotalLength(b) - exampleTotalLength(a);
    if (byLength !== 0) return byLength;

    const bySurvivor =
      Number(b.id === survivor.id) - Number(a.id === survivor.id);
    if (bySurvivor !== 0) return bySurvivor;

    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const chosen = ranked[0];
  if (!chosen) {
    return;
  }

  const origin = chosen.id === survivor.id ? "survivor" : `dup ${chosen.id}`;
  discards.push(
    `example triple: taking all three fields from ${origin} - ` +
      `${quote(chosen.exampleChinese)} / ${quote(chosen.examplePinyin)} / ${quote(chosen.exampleEnglish)}`,
  );

  for (const row of rows) {
    if (
      row.id === chosen.id ||
      exampleFilledCount(row) === 0 ||
      sameTriple(row, chosen)
    ) {
      continue;
    }

    const damaged = !hasIntactChinese(row) && (row.exampleChinese ?? "") !== "";
    discards.push(
      `example triple: dropping ${row.id === survivor.id ? "survivor's" : "duplicate's"} ` +
        `${quote(row.exampleChinese)} / ${quote(row.examplePinyin)} / ${quote(row.exampleEnglish)}` +
        (damaged ? " (exampleChinese is encoding-damaged)" : ""),
    );
  }
}

function sameTriple(a: GroupRow, b: GroupRow) {
  return (
    (a.exampleChinese ?? "") === (b.exampleChinese ?? "") &&
    (a.examplePinyin ?? "") === (b.examplePinyin ?? "") &&
    (a.exampleEnglish ?? "") === (b.exampleEnglish ?? "")
  );
}

/**
 * True when exampleChinese still contains multibyte characters, i.e. it was not
 * mangled to "?????" by an encoding fault. Matches the migration's
 * `octet_length(x) > length(x)` test.
 */
function hasIntactChinese(row: GroupRow) {
  const value = row.exampleChinese ?? "";

  return value !== "" && Buffer.byteLength(value, "utf8") > value.length;
}

function exampleFilledCount(row: GroupRow) {
  return (
    Number((row.exampleChinese ?? "") !== "") +
    Number((row.examplePinyin ?? "") !== "") +
    Number((row.exampleEnglish ?? "") !== "")
  );
}

function exampleTotalLength(row: GroupRow) {
  return (
    (row.exampleChinese ?? "").length +
    (row.examplePinyin ?? "").length +
    (row.exampleEnglish ?? "").length
  );
}

function reportCardMerge(
  discards: string[],
  survivorCard: GroupRow["reviewCard"],
  duplicateCard: GroupRow["reviewCard"],
) {
  if (!duplicateCard) {
    return;
  }

  if (!survivorCard) {
    discards.push(
      `reviewCard: duplicate's card re-pointed to survivor ` +
        `(reviewCount ${duplicateCard.reviewCount}, dueAt ${iso(duplicateCard.dueAt)}) - nothing lost`,
    );
    return;
  }

  const newer = newerReviewCard(survivorCard, duplicateCard);
  const loser = newer === survivorCard ? duplicateCard : survivorCard;

  discards.push(
    `reviewCard.reviewCount: ${survivorCard.reviewCount} + ${duplicateCard.reviewCount} ` +
      `= ${survivorCard.reviewCount + duplicateCard.reviewCount} (summed)`,
  );
  discards.push(
    `reviewCard.lapseCount: ${survivorCard.lapseCount} + ${duplicateCard.lapseCount} ` +
      `= ${survivorCard.lapseCount + duplicateCard.lapseCount} (summed)`,
  );
  discards.push(
    `reviewCard scheduling: keeping dueAt ${iso(newer.dueAt)} / interval ${newer.intervalDays}d / ` +
      `ease ${newer.easeFactor.toFixed(2)}, dropping dueAt ${iso(loser.dueAt)} / ` +
      `interval ${loser.intervalDays}d / ease ${loser.easeFactor.toFixed(2)}`,
  );
  discards.push(
    `reviewCard.status: ${survivorCard.status} + ${duplicateCard.status} -> ` +
      `${mergeStatus(survivorCard.status, duplicateCard.status)}`,
  );
  discards.push(
    `reviewCard: duplicate card ${duplicateCard.id} deleted after its events move to the survivor`,
  );
}

function reportCoalesce(
  discards: string[],
  field: string,
  current: string | null,
  incoming: string | null,
) {
  if (current === null) {
    if (incoming !== null) {
      discards.push(`${field}: adopting ${quote(incoming)} from duplicate`);
    }
    return incoming;
  }

  if (incoming !== null && incoming !== current) {
    discards.push(
      `${field}: dropping ${quote(incoming)} (keeping ${quote(current)})`,
    );
  }

  return current;
}

function readField(row: GroupRow, field: string) {
  return (row as unknown as Record<string, string | null>)[field] ?? null;
}

function richer(current: string | null, incoming: string | null) {
  if (!incoming?.trim()) {
    return current;
  }

  if (!current?.trim()) {
    return incoming;
  }

  return incoming.length > current.length ? incoming : current;
}

function mergeNotes(current: string | null, incoming: string | null) {
  if (!incoming?.trim()) {
    return current;
  }

  if (!current?.trim()) {
    return incoming;
  }

  return current.includes(incoming) ? current : `${current}\n\n${incoming}`;
}

function newerReviewCard<T extends { lastReviewedAt: Date | null }>(
  current: T,
  incoming: T,
) {
  if (!current.lastReviewedAt) {
    return incoming;
  }

  if (!incoming.lastReviewedAt) {
    return current;
  }

  return incoming.lastReviewedAt > current.lastReviewedAt ? incoming : current;
}

function mergeStatus(current: ReviewStatus, incoming: ReviewStatus) {
  return current === "ACTIVE" || incoming === "ACTIVE" ? "ACTIVE" : current;
}

function quote(value: string | null) {
  if (value === null) {
    return "null";
  }

  const collapsed = value.replace(/\s+/g, " ").trim();

  return collapsed.length > 80
    ? `"${collapsed.slice(0, 77)}..."`
    : `"${collapsed}"`;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

reportDuplicates()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("Error during audit:", error);
    prisma.$disconnect();
    process.exit(1);
  });
