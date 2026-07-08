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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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

const themeScript = `
(function () {
  var cookieName = "${appearanceThemeCookieName}";
  var match = document.cookie.match(new RegExp("(?:^|; )" + cookieName + "=([^;]*)"));
  var theme = document.documentElement.dataset.theme || (match ? decodeURIComponent(match[1]) : "system");
  var systemQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function apply() {
    var resolved = theme === "system" ? (systemQuery.matches ? "dark" : "light") : theme;
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.documentElement.dataset.theme = theme;
  }

  apply();
  if (systemQuery.addEventListener) {
    systemQuery.addEventListener("change", apply);
  }
})();
`;