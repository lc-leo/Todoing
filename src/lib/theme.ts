import type { ThemePreference } from "@/lib/todo/types";

export const THEME_KEY = "todoing-theme";

export function readTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function isDarkTheme(theme: ThemePreference): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDarkTheme(theme));
  window.localStorage.setItem(THEME_KEY, theme);
}
