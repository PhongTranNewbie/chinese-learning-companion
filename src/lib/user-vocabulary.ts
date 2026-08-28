import type { CharacterNoteInput } from "@/lib/character-notes";
import { prisma } from "@/lib/db";

/**
 * Write helpers for the catalog / per-user vocabulary split (Phase 3).
 *
 * Every vocabulary write now maintains three things:
 *
 *   1. a single shared catalog "VocabularyItem" (userId: null) per (hanzi, pinyin),
 *   2. one "UserVocabulary" per (user, catalog item) holding that user's own
 *      mnemonic, notes, personal meaning, deck membership and archive state,
 *   3. the caller's legacy owned "VocabularyItem" row, kept in sync so the read
 *      paths - which still scope by "VocabularyItem.userId" until Phase 4 - and
 *      the review scheduler keep working unchanged.
 *
 * (3) is transitional. "ReviewCard.vocabularyItemId" is still NOT NULL and
 * UNIQUE, so a user attaching to a shared catalog row cannot own a card through
 * the catalog; their card hangs off their legacy row and is linked forward via
 * "ReviewCard.userVocabularyId". Phase 5 drops the legacy rows and the old link.
 */

export type VocabularyTx = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

/**
 * Catalog-owned optional columns. Deliberately excludes deckId, source,
 * isArchived, memoryMnemonic and notes: those are per-user and live on
 * "UserVocabulary" in the target architecture.
 */
const catalogOptionalFields = [
  "levelId",
  "partOfSpeech",
  "measureWord",
  "exampleChinese",
  "examplePinyin",
  "exampleEnglish",
  "characterBreakdown",
  "wordFormationNote",
] as const;

type CatalogOptionalField = (typeof catalogOptionalFields)[number];

export type CatalogFields = {
  hanzi: string;
  pinyin: string;
  meaning: string;
} & Partial<Record<CatalogOptionalField, string | null>>;

export type UserVocabularyData = {
  deckId?: string | null;
  personalMeaning?: string | null;
  memoryMnemonic?: string | null;
  personalNotes?: string | null;
  source?: string | null;
  isArchived?: boolean;
};

/**
 * Find - or create - the one shared catalog entry for a (hanzi, pinyin) pair.
 *
 * Existing catalog rows are only ever *enriched*: an empty column may be filled
 * in, but a value another user already relies on is never overwritten, and
 * hanzi/pinyin/meaning are never rewritten here.
 */
export async function resolveSharedCatalogItem(
  tx: VocabularyTx,
  fields: CatalogFields,
  characterNotes: CharacterNoteInput[] = [],
) {
  const hanzi = fields.hanzi.trim();
  const pinyin = fields.pinyin.trim();

  // The DB-level unique index on (hanzi, pinyin) is deferred to Phase 5, so
  // several rows can still share a spelling. Pick the shared unowned row
  // deterministically rather than relying on findUnique against an index that
  // does not exist yet.
  const existing = await tx.vocabularyItem.findFirst({
    where: {
      hanzi,
      pinyin,
      userId: null,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  if (existing) {
    const enrich: Record<string, string | null> = {};

    for (const field of catalogOptionalFields) {
      const incoming = fields[field];
      if (incoming && !existing[field]) {
        enrich[field] = incoming;
      }
    }

    if (Object.keys(enrich).length > 0) {
      await tx.vocabularyItem.update({
        where: { id: existing.id },
        data: enrich,
      });
    }

    if (characterNotes.length > 0) {
      const noteCount = await tx.vocabularyCharacterNote.count({
        where: { vocabularyItemId: existing.id },
      });

      // Fill only. Replacing shared notes would edit them for every other user.
      if (noteCount === 0) {
        await tx.vocabularyCharacterNote.createMany({
          data: characterNotes.map((note) => ({
            ...note,
            vocabularyItemId: existing.id,
          })),
        });
      }
    }

    return { id: existing.id, meaning: existing.meaning, created: false };
  }

  const created = await tx.vocabularyItem.create({
    data: {
      userId: null,
      deckId: null,
      hanzi,
      pinyin,
      meaning: fields.meaning.trim(),
      levelId: fields.levelId ?? null,
      partOfSpeech: fields.partOfSpeech ?? null,
      measureWord: fields.measureWord ?? null,
      exampleChinese: fields.exampleChinese ?? null,
      examplePinyin: fields.examplePinyin ?? null,
      exampleEnglish: fields.exampleEnglish ?? null,
      characterBreakdown: fields.characterBreakdown ?? null,
      wordFormationNote: fields.wordFormationNote ?? null,
      characterNotes:
        characterNotes.length > 0 ? { create: characterNotes } : undefined,
    },
    select: { id: true, meaning: true },
  });

  return { id: created.id, meaning: created.meaning, created: true };
}

/**
 * Create or update the current user's join row for a catalog item. The
 * @@unique([userId, vocabularyItemId]) key makes this idempotent, and scoping
 * by userId keeps one user's learning data off every other user's row.
 */
export async function upsertUserVocabulary(
  tx: VocabularyTx,
  args: {
    userId: string;
    vocabularyItemId: string;
    create: UserVocabularyData;
    update: UserVocabularyData;
  },
) {
  return tx.userVocabulary.upsert({
    where: {
      userId_vocabularyItemId: {
        userId: args.userId,
        vocabularyItemId: args.vocabularyItemId,
      },
    },
    create: {
      userId: args.userId,
      vocabularyItemId: args.vocabularyItemId,
      ...args.create,
    },
    update: args.update,
    select: { id: true },
  });
}

/**
 * The caller's own legacy row for a spelling, if they already have one. Used to
 * keep manual add / import / deck copy idempotent per user instead of minting a
 * second owned row for the same word.
 */
export async function findOwnedVocabularyItem(
  tx: VocabularyTx,
  args: { userId: string; hanzi: string; pinyin: string },
) {
  return tx.vocabularyItem.findFirst({
    where: {
      userId: args.userId,
      hanzi: args.hanzi.trim(),
      pinyin: args.pinyin.trim(),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: {
      reviewCard: {
        select: { id: true, status: true, userVocabularyId: true },
      },
      characterNotes: true,
    },
  });
}

/**
 * Guarantee the user's legacy row has a review card, and point that card at
 * their join row so Phase 4 can read scheduling state through UserVocabulary.
 *
 * "ReviewCard.userVocabularyId" is UNIQUE, so the link is only written when no
 * other card already holds it.
 */
export async function ensureOwnedReviewCard(
  tx: VocabularyTx,
  args: {
    vocabularyItemId: string;
    reviewCardId: string | null;
    userVocabularyId: string;
    dueAt: Date;
  },
) {
  const linkHolder = await tx.reviewCard.findUnique({
    where: { userVocabularyId: args.userVocabularyId },
    select: { id: true },
  });

  if (!args.reviewCardId) {
    const created = await tx.reviewCard.create({
      data: {
        vocabularyItemId: args.vocabularyItemId,
        userVocabularyId: linkHolder ? null : args.userVocabularyId,
        dueAt: args.dueAt,
      },
      select: { id: true },
    });

    return created.id;
  }

  if (!linkHolder) {
    await tx.reviewCard.update({
      where: { id: args.reviewCardId },
      data: { userVocabularyId: args.userVocabularyId },
    });
  }

  return args.reviewCardId;
}

/**
 * Drop a stale join row - used when an edit repoints a word at a different
 * catalog entry.
 *
 * "UserVocabulary" cascades to "ReviewCard", so the card must be unlinked
 * first; deleting while it still points here would take the card and its whole
 * review history with it.
 */
export async function detachUserVocabulary(
  tx: VocabularyTx,
  userVocabularyId: string,
) {
  await tx.reviewCard.updateMany({
    where: { userVocabularyId },
    data: { userVocabularyId: null },
  });

  await tx.userVocabulary.delete({ where: { id: userVocabularyId } });
}

/** Resolve the join row backing one of the caller's legacy owned rows. */
export async function findUserVocabularyForOwnedItem(
  tx: VocabularyTx,
  args: {
    userId: string;
    hanzi: string;
    pinyin: string;
    reviewCardUserVocabularyId: string | null;
  },
) {
  if (args.reviewCardUserVocabularyId) {
    return args.reviewCardUserVocabularyId;
  }

  const catalogItem = await tx.vocabularyItem.findFirst({
    where: {
      hanzi: args.hanzi.trim(),
      pinyin: args.pinyin.trim(),
      userId: null,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  if (!catalogItem) {
    return null;
  }

  const userVocabulary = await tx.userVocabulary.findUnique({
    where: {
      userId_vocabularyItemId: {
        userId: args.userId,
        vocabularyItemId: catalogItem.id,
      },
    },
    select: { id: true },
  });

  return userVocabulary?.id ?? null;
}
