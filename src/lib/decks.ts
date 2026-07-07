"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/db";

export type DeckFormState = {
  errors?: Record<string, string>;
};

function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function createDeck(
  _previousState: DeckFormState,
  formData: FormData,
): Promise<DeckFormState> {
  const user = await requireCurrentUser();
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (!name) {
    return { errors: { name: "Deck name is required." } };
  }

  await prisma.deck.create({
    data: {
      userId: user.id,
      name,
      description: description || null,
    },
  });

  revalidatePath("/decks");
  redirect("/decks");
}

export async function updateDeck(
  deckId: string,
  _previousState: DeckFormState,
  formData: FormData,
): Promise<DeckFormState> {
  const user = await requireCurrentUser();
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (!name) {
    return { errors: { name: "Deck name is required." } };
  }

  const result = await prisma.deck.updateMany({
    where: {
      id: deckId,
      userId: user.id,
    },
    data: {
      name,
      description: description || null,
    },
  });

  if (result.count === 0) {
    redirect("/decks");
  }

  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}

export async function archiveDeck(deckId: string) {
  const user = await requireCurrentUser();

  await prisma.deck.updateMany({
    where: {
      id: deckId,
      userId: user.id,
    },
    data: {
      isArchived: true,
    },
  });

  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  redirect("/decks");
}
