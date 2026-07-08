export const appearanceThemes = ["light", "dark", "system"] as const;

export type AppearanceTheme = (typeof appearanceThemes)[number];

export const appearanceThemeCookieName = "clc-appearance-theme";

export function parseAppearanceTheme(value: unknown): AppearanceTheme {
  return appearanceThemes.includes(value as AppearanceTheme)
    ? (value as AppearanceTheme)
    : "system";
}

export function getAppearanceThemeLabel(theme: AppearanceTheme) {
  if (theme === "light") {
    return "Light";
  }

  if (theme === "dark") {
    return "Dark";
  }

  return "System";
}