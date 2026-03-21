export const THEME_STORAGE_KEY = "onelink-theme";
export const THEME_MODES = ["light", "dark", "blue"] as const;
export const COMPARE_STORAGE_KEY = "onelink-student-compare";

export type ThemeMode = (typeof THEME_MODES)[number];

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return !!value && THEME_MODES.includes(value as ThemeMode);
}

export function normalizeTheme(value: string | null | undefined): ThemeMode | null {
  return isThemeMode(value) ? value : null;
}

export function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {}

  try {
    window.dispatchEvent(
      new CustomEvent("onelink-theme-changed", { detail: { theme } })
    );
  } catch {}
}

export function resolveClientTheme() {
  try {
    const saved = normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (saved) return saved;
  } catch {}

  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark" as const;
    }
  } catch {}

  return "light" as const;
}

export const themeBootScript = `
(() => {
  const storageKey = "${THEME_STORAGE_KEY}";
  const themes = ${JSON.stringify(THEME_MODES)};
  const isTheme = (value) => themes.includes(value);
  const detectTheme = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (isTheme(saved)) return saved;
    } catch {}
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {}
    return "light";
  };
  const setTheme = (theme) => {
    if (!isTheme(theme)) return;
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
    try {
      localStorage.setItem(storageKey, theme);
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent("onelink-theme-changed", { detail: { theme } }));
    } catch {}
  };
  const initialTheme = detectTheme();
  setTheme(initialTheme);
  window.setTheme = setTheme;
})();
`;
