import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

/**
 * useTheme hook
 * Manages theme state with localStorage persistence and system preference detection
 * 
 * Features:
 * - Persists theme choice to localStorage
 * - Respects system preference on first visit
 * - Listens for system theme changes
 * - Updates document.documentElement data-theme attribute
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    // 1. Check localStorage first
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }

    // 2. Fall back to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Apply theme to document and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system theme changes (only if user hasn't set preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Auto-switch only if user hasn't explicitly set a theme
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    isDark: theme === "dark",
  };
}
