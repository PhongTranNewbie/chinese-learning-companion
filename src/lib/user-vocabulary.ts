import type { CharacterNoteInput } from "@/lib/character-notes";
import { prisma } from "@/lib/db";

/**
 * Write helpers for the catalog / per-user vocabulary split (Phase 5).
 *
 * Every vocabulary write maintains two things:
 *
 *   1. a single shared catalog "VocabularyItem" per (hanzi, pinyin),
 *   2. one "UserVocabulary" per (user, catalog item) holding that user's own
 *      mnemonic, notes, personal meaning, deck membership and archive state,
 *      with exactly one "ReviewCard" hanging off the join.
 *
 * The legacy owned "VocabularyItem" rows and the "ReviewCard.vocabularyItemId"
 * link are gone (Migration B). Catalog language data is shared; everything a
 * user personalizes lives on the join row.
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
 * The (hanzi, pinyin) unique index makes the spelling a stable key, so the
 * lookup is exact. Existing catalog rows are only ever *enriched*: an empty
 * column may be filled in, but a value another user already relies on is never
 * overwritten, and hanzi/pinyin/meaning are never rewritten here.
 */
export async function resolveSharedCatalogItem(
  tx: VocabularyTx,
  fields: CatalogFields,
  characterNotes: CharacterNoteInput[] = [],
) {
  const hanzi = fields.hanzi.trim();
  const pinyin = fields.pinyin.trim();

  const existing = await tx.vocabularyItem.findUnique({
    where: { hanzi_pinyin: { hanzi, pinyin } },
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
 * Guarantee the user's join row has a review card. The card hangs off the join
 * ("ReviewCard.userVocabularyId" is UNIQUE and NOT NULL), so an existing card is
 * never touched - only a missing one is created.
 */
export async function ensureReviewCard(
  tx: VocabularyTx,
  args: { userVocabularyId: string; dueAt: Date },
) {
  const created = await tx.reviewCard.upsert({
    where: { userVocabularyId: args.userVocabularyId },
    create: { userVocabularyId: args.userVocabularyId, dueAt: args.dueAt },
    update: {},
    select: { id: true },
  });

  return created.id;
}

/**
 * Delete a stale join row - used when an edit repoints a word at a different
 * catalog entry. The join cascades to its review card, so the card and its
 * review history go with it; the old spelling is no longer part of this user's
 * study set.
 */
export async function deleteUserVocabulary(
  tx: VocabularyTx,
  userVocabularyId: string,
) {
  await tx.userVocabulary.delete({ where: { id: userVocabularyId } });
}
