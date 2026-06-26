import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type VocabularyPageProps = {
  searchParams: Promise<{
    q?: string;
    levelId?: string;
  }>;
};

export default async function VocabularyPage({
  searchParams,
}: VocabularyPageProps) {
  const levels = await prisma.level.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const levelId = params.levelId?.trim() ?? "";

  const where: Prisma.VocabularyItemWhereInput = {
    isArchived: false,
    ...(levelId ? { levelId } : {}),
    ...(query
      ? {
          OR: [
            { hanzi: { contains: query } },
            { pinyin: { contains: query } },
            { meaning: { contains: query } },
          ],
        }
      : {}),
  };

  const vocabularyItems = await prisma.vocabularyItem.findMany({
    where,
    include: {
      level: true,
      reviewCard: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-red-700">
            Vocabulary
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Saved words
          </h1>
          <p className="mt-2 text-slate-600">
            Search active vocabulary and open details for review state.
          </p>
        </div>
        <Link
          href="/vocabulary/new"
          className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
        >
          Add vocabulary
        </Link>
      </div>

      <form className="mt-6 grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Search</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Hanzi, pinyin, or meaning"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Level</span>
          <select
            name="levelId"
            defaultValue={levelId}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-100"
          >
            <option value="">All active levels</option>
            {levels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Apply
          </button>
          <Link
            href="/vocabulary"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset
          </Link>
        </div>
      </form>

      {vocabularyItems.length === 0 ? (
        <section className="mt-10 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            {query || levelId ? "No matching vocabulary" : "No vocabulary yet"}
          </h2>
          <p className="mt-2 text-slate-600">
            {query || levelId
              ? "Try a different search or level filter."
              : "Add your first word to create its initial review card."}
          </p>
          <div className="mt-5">
            {query || levelId ? (
              <Link
                href="/vocabulary"
                className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear filters
              </Link>
            ) : (
              <Link
                href="/vocabulary/new"
                className="inline-flex rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
              >
                Add vocabulary
              </Link>
            )}
          </div>
        </section>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Hanzi</th>
                <th className="px-4 py-3 font-semibold">Pinyin</th>
                <th className="px-4 py-3 font-semibold">Meaning</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {vocabularyItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3 font-medium text-slate-950">
                    {item.hanzi}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.pinyin}</td>
                  <td className="px-4 py-3 text-slate-700">{item.meaning}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.level?.name ?? "None"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.reviewCard?.dueAt.toLocaleDateString() ?? "Missing"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/vocabulary/${item.id}`}
                      className="font-medium text-red-700 hover:text-red-800"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
