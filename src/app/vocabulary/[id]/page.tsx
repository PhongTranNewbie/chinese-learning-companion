import Link from "next/link";
import { notFound } from "next/navigation";
import { archiveVocabularyItem } from "@/lib/vocabulary";
import { prisma } from "@/lib/db";

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
      level: true,
      reviewCard: true,
    },
  });

  if (!vocabularyItem) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/vocabulary" className="text-sm font-medium text-red-700">
            Back to vocabulary
          </Link>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">
            {vocabularyItem.hanzi}
          </h1>
          <p className="mt-2 text-lg text-slate-700">
            {vocabularyItem.pinyin} · {vocabularyItem.meaning}
          </p>
          {vocabularyItem.isArchived ? (
            <p className="mt-3 inline-flex rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
              Archived
            </p>
          ) : null}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/vocabulary/${vocabularyItem.id}/edit`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Edit
          </Link>
          {!vocabularyItem.isArchived ? (
            <form action={archiveVocabularyItem.bind(null, vocabularyItem.id)}>
              <button
                type="submit"
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                Archive
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <InfoBlock label="Level" value={vocabularyItem.level?.name ?? "None"} />
        <InfoBlock
          label="Part of speech"
          value={vocabularyItem.partOfSpeech ?? "None"}
        />
        <InfoBlock
          label="Measure word"
          value={vocabularyItem.measureWord ?? "None"}
        />
        <InfoBlock
          label="Example Chinese"
          value={vocabularyItem.exampleChinese ?? "None"}
        />
        <InfoBlock
          label="Example pinyin"
          value={vocabularyItem.examplePinyin ?? "None"}
        />
        <InfoBlock
          label="Example English"
          value={vocabularyItem.exampleEnglish ?? "None"}
        />
      </section>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Notes</h2>
        <p className="mt-3 whitespace-pre-wrap text-slate-700">
          {vocabularyItem.notes ?? "No notes yet."}
        </p>
      </section>

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Review card</h2>
        {vocabularyItem.reviewCard ? (
          <dl className="mt-5 grid gap-4 md:grid-cols-3">
            <InfoTerm
              label="Due"
              value={formatDateTime(vocabularyItem.reviewCard.dueAt)}
            />
            <InfoTerm
              label="Interval days"
              value={String(vocabularyItem.reviewCard.intervalDays)}
            />
            <InfoTerm
              label="Ease factor"
              value={vocabularyItem.reviewCard.easeFactor.toFixed(2)}
            />
            <InfoTerm
              label="Review count"
              value={String(vocabularyItem.reviewCard.reviewCount)}
            />
            <InfoTerm
              label="Lapse count"
              value={String(vocabularyItem.reviewCard.lapseCount)}
            />
            <InfoTerm label="Status" value={vocabularyItem.reviewCard.status} />
          </dl>
        ) : (
          <p className="mt-3 text-slate-600">No review card found.</p>
        )}
      </section>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-slate-950">{value}</p>
    </div>
  );
}

function InfoTerm({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-950">{value}</dd>
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
