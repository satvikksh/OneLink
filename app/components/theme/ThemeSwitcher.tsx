"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  normalizeTheme,
  resolveClientTheme,
  THEME_MODES,
  type ThemeMode,
} from "../../src/lib/theme";

declare global {
  interface Window {
    setTheme?: (theme: ThemeMode) => void;
  }
}

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  blue: "Light Blue",
};

export default function ThemeSwitcher() {
  const [theme, setThemeState] = useState<ThemeMode>("light");

  useEffect(() => {
    const initialTheme =
      normalizeTheme(document.documentElement.getAttribute("data-theme")) ||
      resolveClientTheme();

    setThemeState(initialTheme);

    const setTheme = (nextTheme: ThemeMode) => {
      applyTheme(nextTheme);
      setThemeState(nextTheme);
    };

    window.setTheme = setTheme;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const savedTheme = normalizeTheme(
        window.localStorage.getItem("onelink-theme")
      );

      if (!savedTheme) {
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        setTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const setTheme = (nextTheme: ThemeMode) => {
    applyTheme(nextTheme);
    setThemeState(nextTheme);
  };

  return (
    <div
      className="theme-switcher glass-panel-strong fixed right-4 top-4 z-50 rounded-full px-2 py-2 sm:right-6 sm:top-6"
      role="group"
      aria-label="Theme switcher"
    >
      <div className="flex items-center gap-2">
        {THEME_MODES.map((mode) => {
          const isActive = theme === mode;

          return (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={`theme-option rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${
                isActive ? "is-active" : ""
              }`}
              aria-pressed={isActive}
            >
              {THEME_LABELS[mode]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
