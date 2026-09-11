"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "auto";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "auto",
  resolvedTheme: "light",
  setTheme: () => {},
});

const STORAGE_KEY = "giftshop_theme";

function applyResolvedTheme(theme: Theme) {
  const resolved =
    theme === "auto"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in layout.tsx already set the right class before
  // paint (avoids a flash of the wrong theme) - this just picks up whatever
  // it decided so React and the DOM agree from the first render.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "auto";
    return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "auto";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    setResolvedTheme(applyResolvedTheme(next));
  }, []);

  // When following the OS ("auto"), keep re-resolving as the OS setting
  // changes while the tab is open.
  useEffect(() => {
    if (theme !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setResolvedTheme(applyResolvedTheme("auto"));
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
