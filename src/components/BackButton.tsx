import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import "../styles/BackButton.css";

/**
 * Fixed top-left "back" button — goes to the PREVIOUS page (browser history).
 * Auto-hides on Home + public auth pages. Mount once in App.
 */
export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  // Hide on root + public auth pages (login/register have their own switch link)
  const hideOn = ["/", "/login", "/register"];
  if (hideOn.includes(location.pathname)) return null;

  return (
    <button
      className="back-button"
      onClick={() => navigate(-1)}
      aria-label={t.back}
      title={t.back}
      type="button"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}
