import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckForm } from "@/components/deck-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type EditDeckPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditDeckPage({ params }: EditDeckPageProps) {
  const { id } = await params;
  const deck = await prisma.deck.findUnique({
    where: {
      id,
    },
  });

  if (!deck) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="border-b border-slate-200 pb-6">
        <Link
          href={`/decks/${deck.id}`}
          className="text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          Back to deck
        </Link>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Edit deck
        </h1>
      </div>

      <section className="mt-8 rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
        <DeckForm deck={deck} />
      </section>
    </main>
  );
}
