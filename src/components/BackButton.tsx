import { useLocation, useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import "../styles/BackButton.css";

/**
 * Fixed top-left navigation button.
 * Auto-hides on Home ("/"). Conversation pages go back to /history; everything
 * else goes back to /. Mount once in App — no per-page wiring needed.
 */
export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  if (location.pathname === "/") return null;

  const to = location.pathname.startsWith("/conversations/") ? "/history" : "/";

  return (
    <button
      className="back-button"
      onClick={() => navigate(to)}
      aria-label={t.backHome}
      title={t.backHome}
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
