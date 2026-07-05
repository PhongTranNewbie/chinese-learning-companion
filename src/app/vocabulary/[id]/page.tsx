import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterNotesDisplay } from "@/components/character-notes-display";
import { archiveVocabularyItem } from "@/lib/vocabulary";
import { prisma } from "@/lib/db";
import { formatPinyinForDisplay } from "@/lib/pinyin-display";

export const dynamic = "force-dynamic";

type VocabularyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VocabularyDetailPage({
  params,
}: VocabularyDetailPageProps) {
  const { id } = await params;
  const vocabularyItem = await prisma.vocabularyItem.findUnique({
    where: {
      id,
    },
    include: {
      deck: true,
      level: true,
      reviewCard: true,
      characterNotes: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

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
  const activeDeck =
    vocabularyItem.deck && !vocabularyItem.deck.isArchived
      ? vocabularyItem.deck
      : null;
  const primaryStudyHref = activeDeck
    ? `/decks/${activeDeck.id}/study`
    : "/review";
  const primaryStudyLabel = activeDeck ? "Study this deck" : "Review now";
  const practiceHelper = activeDeck
    ? "Review this word when it is due, or study it in context with its deck."
    : "Review this word when it is due and keep it moving through your study routine.";

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/vocabulary" className="text-sm font-medium text-teal-700">
            Back to vocabulary library
          </Link>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/vocabulary/${vocabularyItem.id}/edit`}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Edit
            </Link>
            {!vocabularyItem.isArchived ? (
              <form action={archiveVocabularyItem.bind(null, vocabularyItem.id)}>
                <button
                  type="submit"
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm ring-1 ring-rose-100 transition hover:bg-rose-50"
                >
                  Archive
                </button>
              </form>
            ) : null}
          </div>
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
