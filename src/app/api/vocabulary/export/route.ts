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

  const vocabularyItems = await prisma.userVocabulary.findMany({
    where: {
      userId: user.id,
      isArchived: false,
      ...(deckId ? { deckId } : {}),
    },
    include: {
      deck: true,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  const csv = toCsv(
    vocabularyItems.map((uv) => ({
      hanzi: uv.vocabularyItem.hanzi,
      pinyin: uv.vocabularyItem.pinyin,
      meaning: uv.personalMeaning ?? uv.vocabularyItem.meaning,
      level: uv.vocabularyItem.level?.name ?? "",
      deck: uv.deck?.name ?? "",
      partOfSpeech: uv.vocabularyItem.partOfSpeech ?? "",
      measureWord: uv.vocabularyItem.measureWord ?? "",
      exampleChinese: uv.vocabularyItem.exampleChinese ?? "",
      examplePinyin: uv.vocabularyItem.examplePinyin ?? "",
      exampleEnglish: uv.vocabularyItem.exampleEnglish ?? "",
      characterBreakdown: uv.vocabularyItem.characterBreakdown ?? "",
      wordFormationNote: uv.vocabularyItem.wordFormationNote ?? "",
      memoryMnemonic: uv.memoryMnemonic ?? "",
      characterNotes: serializeCharacterNotes(uv.vocabularyItem.characterNotes),
      notes: uv.personalNotes ?? "",
    })),
  );

  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${deckId ? "deck" : "vocabulary"}-export.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
