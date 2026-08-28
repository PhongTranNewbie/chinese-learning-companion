import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { CharacterNotesDisplay } from "@/components/character-notes-display";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { archiveVocabularyItem } from "@/lib/vocabulary";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";
import { findUserVocabularyForOwnedItem } from "@/lib/user-vocabulary";

export const dynamic = "force-dynamic";

const detailInclude = {
  deck: true,
  level: true,
  reviewCard: true,
  characterNotes: {
    orderBy: {
      sortOrder: "asc",
    },
  },
} as const satisfies Prisma.VocabularyItemInclude;

type DetailVocabularyItem = Prisma.VocabularyItemGetPayload<{
  include: typeof detailInclude;
}>;

type VocabularyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VocabularyDetailPage({
  params,
}: VocabularyDetailPageProps) {
  const user = await getCurrentUser();
  const userId = user?.id ?? null;
  const { id } = await params;

  let vocabularyItem: DetailVocabularyItem | null = null;

  if (!userId) {
    // A guest has no join rows; the legacy owned row for "id + userId" is a
    // public catalog row, read exactly as before so existing starter URLs keep
    // resolving.
    vocabularyItem = await prisma.vocabularyItem.findFirst({
      where: {
        id,
        userId: null,
      },
      include: detailInclude,
    });
  } else {
    // The legacy owned "VocabularyItem.id" stays the authorization/URL anchor.
    // Resolve it with "id + userId", then read per-user fields and the card
    // through the join that backs it.
    vocabularyItem = await prisma.$transaction(async (tx) => {
      const owned = await tx.vocabularyItem.findFirst({
        where: {
          id,
          userId,
        },
        select: {
          id: true,
          hanzi: true,
          pinyin: true,
          reviewCard: {
            select: {
              userVocabularyId: true,
            },
          },
        },
      });

      if (!owned) {
        return null;
      }

      const userVocabularyId = await findUserVocabularyForOwnedItem(tx, {
        userId,
        hanzi: owned.hanzi,
        pinyin: owned.pinyin,
        reviewCardUserVocabularyId: owned.reviewCard?.userVocabularyId ?? null,
      });

      if (userVocabularyId) {
        const userVocabulary = await tx.userVocabulary.findFirst({
          where: {
            id: userVocabularyId,
            userId,
          },
          include: {
            deck: true,
            reviewCard: true,
            vocabularyItem: {
              include: {
                level: true,
                characterNotes: {
                  orderBy: {
                    sortOrder: "asc",
                  },
                },
              },
            },
          },
        });

        if (userVocabulary) {
          return {
            // Catalog scalars come from the shared entry; per-user fields are
            // overridden from the join. The legacy owned id stays the URL
            // identity for the edit link and archive action.
            ...userVocabulary.vocabularyItem,
            id: owned.id,
            deckId: userVocabulary.deckId,
            isArchived: userVocabulary.isArchived,
            deck: userVocabulary.deck,
            reviewCard: userVocabulary.reviewCard,
            memoryMnemonic: userVocabulary.memoryMnemonic,
            notes: userVocabulary.personalNotes,
            // The write path stores a meaning that differs from the catalog as
            // "personalMeaning", leaving it null when it matches. This
            // reconstructs exactly what the legacy row's "meaning" held.
            meaning:
              userVocabulary.personalMeaning ??
              userVocabulary.vocabularyItem.meaning,
          };
        }
      }

      // No join yet: fall back to the legacy owned row's own fields.
      return tx.vocabularyItem.findFirst({
        where: {
          id: owned.id,
          userId,
        },
        include: detailInclude,
      });
    });
  }

  if (!vocabularyItem) {
    notFound();
  }

  const hasCharacterStories = vocabularyItem.characterNotes.length > 0;
  const wordMemoryPanels = getWordMemoryPanels({
    characterBreakdown: vocabularyItem.characterBreakdown,
    wordFormationNote: vocabularyItem.wordFormationNote,
    memoryMnemonic: vocabularyItem.memoryMnemonic,
  });
  const hasWordLevelMemoryNotes =
    !hasCharacterStories && wordMemoryPanels.length > 0;
  const hasExample = Boolean(
    vocabularyItem.exampleChinese ||
      vocabularyItem.examplePinyin ||
      vocabularyItem.exampleEnglish,
  );
  const hasNotes = Boolean(vocabularyItem.notes?.trim());
  const hasActiveReviewCard = vocabularyItem.reviewCard?.status === "ACTIVE";
  const isReviewDue = Boolean(
    hasActiveReviewCard &&
      vocabularyItem.reviewCard &&
      vocabularyItem.reviewCard.dueAt <= new Date(),
  );
  const activeDeck =
    !vocabularyItem.isArchived &&
    hasActiveReviewCard &&
    vocabularyItem.deck &&
    !vocabularyItem.deck.isArchived
      ? vocabularyItem.deck
      : null;
  let primaryStudyHref = "/vocabulary";
  let primaryStudyLabel = "Back to vocabulary";
  let practiceHelper = "This word does not have an active review card right now.";

  if (vocabularyItem.isArchived) {
    practiceHelper =
      "This word is archived, so it is hidden from active study sessions.";
  } else if (activeDeck) {
    primaryStudyHref = `/decks/${activeDeck.id}/study`;
    primaryStudyLabel = "Study this deck";
    practiceHelper =
      "Review this word when it is due, or study it in context with its deck.";
  } else if (isReviewDue) {
    primaryStudyHref = "/review";
    primaryStudyLabel = "Review now";
    practiceHelper =
      "This word is due now. Review it to keep it moving through your study routine.";
  } else if (hasActiveReviewCard) {
    practiceHelper =
      "This word is not due yet. It will appear in Review when it is time.";
  }

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/vocabulary" className="text-sm font-medium text-teal-700">
            Back to vocabulary library
          </Link>
          {user ? (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/vocabulary/${vocabularyItem.id}/edit`}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Edit
              </Link>
              {!vocabularyItem.isArchived ? (
                <form action={archiveVocabularyItem.bind(null, vocabularyItem.id)}>
                  <PendingSubmitButton
                    idleLabel="Archive"
                    pendingLabel="Archiving..."
                    className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-50"
                  />
                </form>
              ) : null}
            </div>
          ) : null}
        </div>
        <section className="mt-5 overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-100">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="bg-gradient-to-br from-teal-50 to-white px-5 py-7 text-center sm:px-8 sm:py-9">
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {vocabularyItem.deck ? (
                  <LearningChip label={vocabularyItem.deck.name} tone="teal" />
                ) : null}
                {vocabularyItem.level ? (
                  <LearningChip label={vocabularyItem.level.name} tone="green" />
                ) : null}
                {vocabularyItem.partOfSpeech ? (
                  <LearningChip label={vocabularyItem.partOfSpeech} />
                ) : null}
                {vocabularyItem.measureWord ? (
                  <LearningChip label={`MW: ${vocabularyItem.measureWord}`} />
                ) : null}
                {vocabularyItem.isArchived ? (
                  <LearningChip label="Archived" />
                ) : null}
              </div>
              <h1 className="mt-5 text-7xl font-semibold leading-none text-teal-700 sm:text-8xl">
                {vocabularyItem.hanzi}
              </h1>
              <p className="mt-5 text-2xl font-semibold text-slate-950">
                {formatPinyinForDisplay(vocabularyItem.pinyin)}
              </p>
              <p className="mt-2 text-xl text-slate-700">
                {vocabularyItem.meaning}
              </p>
            </div>

            <div className="flex flex-col justify-center border-t border-slate-100 bg-white p-5 sm:p-6 lg:border-l lg:border-t-0">
              <p className="text-sm font-semibold text-teal-700">Practice next</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Keep it moving
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {practiceHelper}
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href={primaryStudyHref}
                  className="rounded-md bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-800"
                >
                  {primaryStudyLabel}
                </Link>
                {activeDeck ? (
                  <Link
                    href="/review"
                    className="rounded-md bg-white px-4 py-3 text-center text-sm font-semibold text-teal-700 ring-1 ring-teal-200 transition hover:bg-teal-50"
                  >
                    Review due cards
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {hasWordLevelMemoryNotes || hasCharacterStories ? (
          <section className="mt-5 rounded-md border-t-4 border-teal-700 bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold text-teal-700">
                  How to remember
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  Components and memory story
                </h2>
              </div>
              <p className="text-sm font-semibold text-teal-700">
                {vocabularyItem.hanzi}
              </p>
            </div>
            {hasWordLevelMemoryNotes ? (
              <div className="mt-4 rounded-md bg-slate-50 p-4 ring-1 ring-slate-100">
                <div className="grid gap-3 md:grid-cols-2">
                  {wordMemoryPanels.map((panel) => (
                    <MemoryPanel
                      key={panel.label}
                      label={panel.label}
                      value={panel.value}
                      warm={panel.warm}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <CharacterNotesDisplay
              notes={vocabularyItem.characterNotes}
              className="mt-4"
            />
            {!hasCharacterStories && hasWordLevelMemoryNotes ? (
              <p className="mt-4 text-xs text-slate-500">
                Mnemonic aid, not guaranteed historical etymology.
              </p>
            ) : null}
          </section>
        ) : null}

        {hasExample ? (
          <section className="mt-5 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-teal-700">Example sentence</p>
            <div className="mt-3 max-w-3xl">
              {vocabularyItem.exampleChinese ? (
                <p className="text-2xl font-semibold leading-9 text-slate-950">
                  <HighlightedChinese
                    text={vocabularyItem.exampleChinese}
                    target={vocabularyItem.hanzi}
                  />
                </p>
              ) : null}
              <div className="mt-3 rounded-md bg-slate-50 p-4">
                {vocabularyItem.examplePinyin ? (
                  <p className="text-sm leading-6 text-slate-600">
                    {formatPinyinForDisplay(vocabularyItem.examplePinyin)}
                  </p>
                ) : null}
                {vocabularyItem.exampleEnglish ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {vocabularyItem.exampleEnglish}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {hasNotes ? (
          <section className="mt-5 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-semibold text-slate-950">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-slate-700">
              {vocabularyItem.notes}
            </p>
          </section>
        ) : null}

        <details className="mt-5 rounded-md bg-white p-5 text-sm text-slate-600 shadow-sm ring-1 ring-slate-100">
          <summary className="cursor-pointer font-semibold text-slate-700">
            Review details
          </summary>
          {vocabularyItem.reviewCard ? (
            <dl className="mt-5 grid gap-4 md:grid-cols-3">
              <InfoTerm
                label="Next review"
                value={formatDateTime(vocabularyItem.reviewCard.dueAt)}
              />
              <InfoTerm
                label="Review interval"
                value={`${vocabularyItem.reviewCard.intervalDays} day${
                  vocabularyItem.reviewCard.intervalDays === 1 ? "" : "s"
                }`}
              />
              <InfoTerm
                label="Memory strength"
                value={vocabularyItem.reviewCard.easeFactor.toFixed(2)}
              />
              <InfoTerm
                label="Reviews completed"
                value={String(vocabularyItem.reviewCard.reviewCount)}
              />
              <InfoTerm
                label="Times forgotten"
                value={String(vocabularyItem.reviewCard.lapseCount)}
              />
              <InfoTerm
                label="Card status"
                value={vocabularyItem.reviewCard.status.toLocaleLowerCase()}
              />
            </dl>
          ) : (
            <p className="mt-3">No review card found for this vocabulary item.</p>
          )}
        </details>
      </div>
    </main>
  );
}

function LearningChip({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "teal" | "green" | "slate";
}) {
  const toneClass =
    tone === "teal"
      ? "bg-teal-50 text-teal-800 ring-teal-100"
      : tone === "green"
        ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
        : "bg-slate-50 text-slate-700 ring-slate-100";

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ${toneClass}`}
    >
      {label}
    </span>
  );
}

function MemoryPanel({
  label,
  value,
  warm = false,
}: {
  label: string;
  value: string;
  warm?: boolean;
}) {
  return (
    <div
      className={
        warm
          ? "rounded-md bg-amber-50 p-4 ring-1 ring-amber-100"
          : "rounded-md bg-teal-50 p-4 ring-1 ring-teal-100"
      }
    >
      <p
        className={
          warm
            ? "text-sm font-semibold text-amber-950"
            : "text-sm font-semibold text-teal-950"
        }
      >
        {label}
      </p>
      <p
        className={
          warm
            ? "mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900"
            : "mt-2 whitespace-pre-wrap text-sm leading-6 text-teal-900"
        }
      >
        {cleanMemoryText(value)}
      </p>
    </div>
  );
}

function getWordMemoryPanels({
  characterBreakdown,
  wordFormationNote,
  memoryMnemonic,
}: {
  characterBreakdown: string | null;
  wordFormationNote: string | null;
  memoryMnemonic: string | null;
}) {
  const panels: { label: string; value: string; warm?: boolean }[] = [];
  const seen = new Set<string>();

  const addPanel = (label: string, value: string | null, warm = false) => {
    if (!value?.trim()) {
      return;
    }

    const cleanedValue = cleanMemoryText(value);
    const normalizedValue = normalizeMemoryText(cleanedValue);

    if (!cleanedValue || seen.has(normalizedValue)) {
      return;
    }

    seen.add(normalizedValue);
    panels.push({ label, value: cleanedValue, warm });
  };

  addPanel("Character formula", characterBreakdown);
  addPanel("Component meanings", wordFormationNote);
  addPanel("Memory story", memoryMnemonic, true);

  return panels;
}

function HighlightedChinese({
  text,
  target,
}: {
  text: string;
  target: string;
}) {
  if (!target || !text.includes(target)) {
    return <>{text}</>;
  }

  const parts = text.split(target);

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? (
            <mark className="rounded bg-teal-50 px-1 text-teal-800">
              {target}
            </mark>
          ) : null}
        </span>
      ))}
    </>
  );
}

function cleanMemoryText(value: string) {
  return value
    .replace(/^(updated\s+)?memory (aid|story):\s*/i, "")
    .replace(/\s*[.;]\s*this is (a )?[^.]*mnemonic[^.]*\./gi, "")
    .replace(/\s*[.;]\s*this is (a )?[^.]*origin[^.]*\./gi, "")
    .replace(/\s*[.;,]\s*mnemonic only[^.]*\./gi, "")
    .replace(/\s*[.;,]\s*not (a )?(true )?origin[^.]*\./gi, "")
    .trim();
}

function normalizeMemoryText(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function InfoTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-slate-700">{value}</dd>
    </div>
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}
