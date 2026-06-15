import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";

/**
 * Theme + language toggles for the auth surface (Login / Register / VerifyEmail).
 * Pinned to the top-right corner of the auth page, above the ambient blobs.
 * Mirrors the controls in <HeaderControls> but without the signed-in actions
 * (profile / logout), since no user exists on the auth screens.
 */
export default function AuthTopControls() {
  const { systemLang, theme, toggleTheme, setSystemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  return (
    <div
      className="auth-controls"
      role="toolbar"
      aria-label={t.a11yDisplaySettings}
    >
      <button
        type="button"
        className="auth-controls__btn"
        onClick={toggleTheme}
        aria-label={theme === "light" ? t.a11yThemeToDark : t.a11yThemeToLight}
        title={theme === "light" ? t.a11yThemeToDark : t.a11yThemeToLight}
      >
        {theme === "light" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
        type="button"
        className="auth-controls__btn auth-controls__btn--lang"
        onClick={() => setSystemLang(systemLang === "vi" ? "en" : "vi")}
        aria-label={`${t.a11ySwitchLang} (${systemLang.toUpperCase()})`}
        title={`${t.a11ySwitchLang} (${systemLang.toUpperCase()})`}
      >
        {systemLang.toUpperCase()}
      </button>
    </div>
  );
}
