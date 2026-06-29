"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (!name) {
    return { errors: { name: "Deck name is required." } };
  }

  await prisma.deck.create({
    data: {
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
  const name = readString(formData, "name");
  const description = readString(formData, "description");

  if (!name) {
    return { errors: { name: "Deck name is required." } };
  }

  await prisma.deck.update({
    where: {
      id: deckId,
    },
    data: {
      name,
      description: description || null,
    },
  });

  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}

export async function archiveDeck(deckId: string) {
  await prisma.deck.update({
    where: {
      id: deckId,
    },
    data: {
      isArchived: true,
    },
  });

  revalidatePath("/decks");
  revalidatePath(`/decks/${deckId}`);
  redirect("/decks");
}
