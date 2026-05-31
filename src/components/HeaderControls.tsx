import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT } from "../constants/uiText";
import { ConfirmDialog } from "./ui";

/**
 * Control cluster for the app shell header (theme + language toggles, and —
 * when signed in — home, profile and logout). Rendered INLINE inside
 * <AppLayout> (no fixed positioning of its own). Logic unchanged; only the
 * presentation moved into the shell and the logout confirm now uses the
 * shared ConfirmDialog primitive.
 */
export default function HeaderControls() {
  const { systemLang, theme, toggleTheme, setSystemLang } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const t = UI_TEXT[systemLang];
  const [confirming, setConfirming] = useState(false);

  const handleLogout = async () => {
    await logout();
    setConfirming(false);
    navigate("/login", { replace: true });
  };

  return (
    <div
      className="app-header__controls"
      role="toolbar"
      aria-label={t.appName}
    >
      <button
        type="button"
        className="app-icon-btn"
        onClick={toggleTheme}
        aria-label={
          theme === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
        title={
          theme === "light" ? "Switch to dark mode" : "Switch to light mode"
        }
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
        className="app-icon-btn app-icon-btn--lang"
        onClick={() => setSystemLang(systemLang === "vi" ? "en" : "vi")}
        aria-label={`Switch language (current: ${systemLang.toUpperCase()})`}
        title={`Switch language — currently ${systemLang.toUpperCase()}`}
      >
        {systemLang.toUpperCase()}
      </button>

      {user && (
        <button
          type="button"
          className="app-icon-btn"
          onClick={() => navigate("/profile")}
          aria-label={t.profileLink}
          title={`${user.email} — ${t.profileLink}`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      )}

      {user && (
        <button
          type="button"
          className="app-icon-btn"
          onClick={() => setConfirming(true)}
          aria-label={t.authLogout}
          title={`${user.email} — ${t.authLogout}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      )}

      {user && (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={handleLogout}
          title={t.logoutConfirmTitle}
          message={t.logoutConfirmMessage}
          confirmLabel={t.authLogout}
          cancelLabel={t.cancelBtn}
          closeLabel={t.closeBtn}
          tone="danger"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          }
        />
      )}
    </div>
  );
}
