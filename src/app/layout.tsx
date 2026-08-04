import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { AppNav } from "@/components/app-nav";
import {
  appearanceThemeCookieName,
  parseAppearanceTheme,
  type AppearanceTheme,
} from "@/lib/appearance";
import { prisma } from "@/lib/db";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chinese Learning Companion",
  description: "A Mandarin vocabulary and spaced repetition study companion.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, session] = await Promise.all([cookies(), auth()]);
  const cookieTheme = parseAppearanceTheme(
    cookieStore.get(appearanceThemeCookieName)?.value,
  );
  const memberTheme = session?.user?.id
    ? await getMemberAppearanceTheme(session.user.id)
    : null;
  const theme = memberTheme ?? cookieTheme;

  return (
    <html
      lang="en"
      className={theme === "dark" ? "dark" : undefined}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body>
        <AppNav />
        {children}
      </body>
    </html>
  );
}

async function getMemberAppearanceTheme(userId: string) {
  const preferences = await prisma.userStudyPreference.findUnique({
    where: {
      userId,
    },
    select: {
      appearanceTheme: true,
    },
  });

  return preferences
    ? parseAppearanceTheme(preferences.appearanceTheme)
    : (null as AppearanceTheme | null);
}

