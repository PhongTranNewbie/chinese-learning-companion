import { toCsv } from "@/lib/csv";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get("deckId")?.trim() || undefined;

  const vocabularyItems = await prisma.vocabularyItem.findMany({
    where: {
      isArchived: false,
      ...(deckId ? { deckId } : {}),
      ...(deckId
        ? {
            deck: {
              isArchived: false,
            },
          }
        : {}),
    },
    include: {
      deck: true,
      level: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const csv = toCsv(
    vocabularyItems.map((item) => ({
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      meaning: item.meaning,
      level: item.level?.name ?? "",
      deck: item.deck?.name ?? "",
      partOfSpeech: item.partOfSpeech ?? "",
      measureWord: item.measureWord ?? "",
      exampleChinese: item.exampleChinese ?? "",
      examplePinyin: item.examplePinyin ?? "",
      exampleEnglish: item.exampleEnglish ?? "",
      characterBreakdown: item.characterBreakdown ?? "",
      wordFormationNote: item.wordFormationNote ?? "",
      memoryMnemonic: item.memoryMnemonic ?? "",
      notes: item.notes ?? "",
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${deckId ? "deck" : "vocabulary"}-export.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
