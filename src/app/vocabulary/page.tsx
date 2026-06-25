import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VocabularyPage() {
  const vocabularyItems = await prisma.vocabularyItem.findMany({
    include: {
      level: true,
      reviewCard: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-red-700">
            Vocabulary
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Saved words
          </h1>
        </div>
        <Link
          href="/vocabulary/new"
          className="inline-flex items-center justify-center rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800"
        >
          Add vocabulary
        </Link>
      </div>

      {vocabularyItems.length === 0 ? (
        <section className="mt-10 rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-semibold text-slate-950">
            No vocabulary yet
          </h2>
          <p className="mt-2 text-slate-600">
            Add your first word to create its initial review card.
          </p>
        </section>
      ) : (
        <div className="mt-8 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Hanzi</th>
                <th className="px-4 py-3 font-semibold">Pinyin</th>
                <th className="px-4 py-3 font-semibold">Meaning</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Due</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
