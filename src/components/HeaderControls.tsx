import { useSettings } from "../hooks/useSettings";
import "../styles/HeaderControls.css";

/**
 * Floating top-right control bar present on every page (mounted in App).
 * Holds two quick toggles: theme (light/dark) and system language (VI/EN).
 * Settings shortcut intentionally lives only on the Home page.
 */
export default function HeaderControls() {
  const { systemLang, theme, toggleTheme, setSystemLang } = useSettings();

  return (
    <div className="header-controls" role="toolbar" aria-label="Global controls">
      <button
        className="header-controls__btn"
        onClick={toggleTheme}
        aria-label={
          theme === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
        title={
          theme === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
      >
        {theme === "light" ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>

      <button
        className="header-controls__btn header-controls__btn--lang"
        onClick={() => setSystemLang(systemLang === "vi" ? "en" : "vi")}
        aria-label={`Switch language (current: ${systemLang.toUpperCase()})`}
        title={`Switch language — currently ${systemLang.toUpperCase()}`}
      >
        <span className="header-controls__lang-text">
          {systemLang.toUpperCase()}
        </span>
      </button>
    </div>
  );
}
