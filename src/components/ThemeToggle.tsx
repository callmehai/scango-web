import { useEffect, useState } from "react";
import "../styles/ThemeToggle.css";

export default function ThemeToggle() {
  // Get initial theme from localStorage or system preference
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";

    // Respect system preference if no stored preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Apply theme to document root and persist choice
  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [isDark]);

  // Listen for system theme changes (if user hasn't set preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches);
      }
    };

    // Modern browsers
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDark ? "☀️" : "🌙"}
      </span>
      <span className="theme-toggle__text">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
