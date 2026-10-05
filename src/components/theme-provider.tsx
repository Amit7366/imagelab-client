"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "imagelab.theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => undefined,
  toggleTheme: () => undefined,
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const next: Theme = stored === "dark" ? "dark" : "light";
    setThemeState(next);
    applyTheme(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: (next) => {
        setThemeState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
      },
      toggleTheme: () => {
        setThemeState((current) => {
          const next: Theme = current === "dark" ? "light" : "dark";
          window.localStorage.setItem(STORAGE_KEY, next);
          applyTheme(next);
          return next;
        });
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className={`il-theme-toggle ${className}`.trim()}
      aria-label={next === "dark" ? "Switch to dark mode" : "Switch to light mode"}
      onClick={toggleTheme}
    >
      <span className="material-symbols-outlined text-[20px]">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
    </button>
  );
}

export function bindStitchThemeToggle(root: HTMLElement, toggleTheme: () => void, theme: Theme) {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-il-theme='toggle']")];
  const onClick = () => toggleTheme();
  for (const button of buttons) {
    const icon = button.querySelector(".material-symbols-outlined");
    if (icon) icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
    button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    button.addEventListener("click", onClick);
  }
  for (const img of root.querySelectorAll<HTMLImageElement>("[data-il-logo='lockup']")) {
    img.src = theme === "dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png";
  }
  return () => {
    for (const button of buttons) button.removeEventListener("click", onClick);
  };
}
