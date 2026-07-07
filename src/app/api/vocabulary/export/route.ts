import { NextResponse } from "next/server";
import { toCsv } from "@/lib/csv";
import { serializeCharacterNotes } from "@/lib/character-notes";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get("deckId")?.trim() || undefined;

  if (deckId) {
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        userId: user.id,
        isArchived: false,
      },
      select: {
        id: true,
      },
    });

    if (!deck) {
      return new Response("Deck not found.", { status: 404 });
    }
  }

  const vocabularyItems = await prisma.vocabularyItem.findMany({
    where: {
      userId: user.id,
      isArchived: false,
      ...(deckId ? { deckId } : {}),
    },
    include: {
      deck: true,
      level: true,
      characterNotes: {
        orderBy: {
          sortOrder: "asc",
        },
      },
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
      characterNotes: serializeCharacterNotes(item.characterNotes),
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
