"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "ems-theme";

function getSystemTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";

    const savedTheme = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : getSystemTheme();
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  }

  const label = theme === "dark" ? "Dark mode" : "Light mode";
  const symbol = theme === "dark" ? "☾" : "☼";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)] shadow-[0_10px_30px_rgba(9,42,72,0.08)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
      aria-label="Wissel tussen lichte en donkere modus"
    >
      <span suppressHydrationWarning className="text-base leading-none">
        {symbol}
      </span>
      <span suppressHydrationWarning>{label}</span>
    </button>
  );
}
