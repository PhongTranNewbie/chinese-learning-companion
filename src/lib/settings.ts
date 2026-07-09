"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, requireCurrentUser } from "@/lib/current-user";
import {
  appearanceThemeCookieName,
  parseAppearanceTheme,
} from "@/lib/appearance";
import { prisma } from "@/lib/db";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/passwords";
import {
  clampPreferenceNumber,
  defaultStudyPreferences,
} from "@/lib/study-preferences";


async function getRedirectTarget(fallback = "/settings") {
  const headerStore = await headers();
  const referer = headerStore.get("referer");

  if (!referer) {
    return fallback;
  }

  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

async function setAppearanceCookie(theme: string) {
  const cookieStore = await cookies();
  cookieStore.set(appearanceThemeCookieName, theme, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
function readString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function readPassword(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export type ChangePasswordState = {
  error?: string;
  success?: string;
};

export async function updateDisplayName(formData: FormData) {
  const user = await requireCurrentUser();
  const name = readString(formData, "name");

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name: name || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  redirect("/settings?profile=updated");
}

export async function updateStudyPreferences(formData: FormData) {
  const user = await requireCurrentUser();
  const dailyReviewGoal = clampPreferenceNumber(
    formData.get("dailyReviewGoal"),
    defaultStudyPreferences.dailyReviewGoal,
  );
  const reviewSessionSize = clampPreferenceNumber(
    formData.get("reviewSessionSize"),
    defaultStudyPreferences.reviewSessionSize,
  );
  const deckStudySessionSize = clampPreferenceNumber(
    formData.get("deckStudySessionSize"),
    defaultStudyPreferences.deckStudySessionSize,
  );
  const showMemoryAidOnReveal = formData.get("showMemoryAidOnReveal") === "on";

  await prisma.userStudyPreference.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      dailyReviewGoal,
      reviewSessionSize,
      deckStudySessionSize,
      showMemoryAidOnReveal,
    },
    update: {
      dailyReviewGoal,
      reviewSessionSize,
      deckStudySessionSize,
      showMemoryAidOnReveal,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/review");
  revalidatePath("/decks/[id]/study", "page");
  redirect("/settings?preferences=updated");
}

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await requireCurrentUser();
  const currentPassword = readPassword(formData, "currentPassword");
  const newPassword = readPassword(formData, "newPassword");
  const confirmPassword = readPassword(formData, "confirmPassword");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      error: "Enter your current password and a new password.",
    };
  }

  const passwordError = validatePassword(newPassword);

  if (passwordError) {
    return {
      error: passwordError,
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: "New password and confirmation must match.",
    };
  }

  const account = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
    select: {
      passwordHash: true,
    },
  });

  if (!account?.passwordHash) {
    return {
      error: "Password change is not available for this account.",
    };
  }

  const currentPasswordMatches = await verifyPassword(
    currentPassword,
    account.passwordHash,
  );

  if (!currentPasswordMatches) {
    return {
      error: "Current password is incorrect.",
    };
  }

  const newPasswordMatchesCurrent = await verifyPassword(
    newPassword,
    account.passwordHash,
  );

  if (newPasswordMatchesCurrent) {
    return {
      error: "Choose a new password that is different from your current password.",
    };
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      passwordHash: await hashPassword(newPassword),
    },
  });

  revalidatePath("/settings");

  return {
    success: "Password changed. Use your new password the next time you sign in.",
  };
}
export async function updateAppearanceTheme(formData: FormData) {
  const theme = parseAppearanceTheme(readString(formData, "appearanceTheme"));
  const user = await getCurrentUser();

  await setAppearanceCookie(theme);

  if (user) {
    await prisma.userStudyPreference.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        ...defaultStudyPreferences,
        appearanceTheme: theme,
      },
      update: {
        appearanceTheme: theme,
      },
    });

    revalidatePath("/settings");
  }

  revalidatePath("/", "layout");
  redirect(await getRedirectTarget(user ? "/settings?appearance=updated" : "/"));
}