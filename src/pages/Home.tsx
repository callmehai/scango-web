import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import Logo from "../components/Logo";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  return (
    <div className="home">
      {/* Main Content */}
      <div className="home__container">
        {/* Hero Section */}
        <header className="home__header">
          <div className="home__logo-wrapper">
            <div className="home__logo">
              <Logo height={88} className="home__logo-image" />
            </div>
          </div>

          <h1 className="home__title">
            <span className="gradient-text">{t.appName}</span>
          </h1>
          <p className="home__subtitle">{t.homeSubtitle}</p>
        </header>

        {/* Action Cards */}
        <section className="home__actions">
          <div
            className="action-card action-card--primary"
            onClick={() => navigate("/scan")}
            role="button"
            tabIndex={0}
            aria-label={t.scanAria}
          >
            <div className="action-card__icon-wrapper">
              <div className="action-card__icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
            <div className="action-card__content">
              <h3 className="action-card__title">{t.scanBtn}</h3>
              <p className="action-card__description">{t.scanBtnDescription}</p>
            </div>
            <div className="action-card__arrow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div
            className="action-card action-card--secondary"
            onClick={() => navigate("/history")}
            role="button"
            tabIndex={0}
            aria-label={t.historyAria}
          >
            <div className="action-card__icon-wrapper">
              <div className="action-card__icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  <path d="M8 10h8M8 14h4" />
                </svg>
              </div>
            </div>
            <div className="action-card__content">
              <h3 className="action-card__title">{t.historyBtn}</h3>
              <p className="action-card__description">
                {t.historyBtnDescription}
              </p>
            </div>
            <div className="action-card__arrow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          <div
            className="action-card action-card--tertiary"
            onClick={() => navigate("/settings")}
            role="button"
            tabIndex={0}
            aria-label={t.settings}
          >
            <div className="action-card__icon-wrapper">
              <div className="action-card__icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
            </div>
            <div className="action-card__content">
              <h3 className="action-card__title">{t.settings}</h3>
              <p className="action-card__description">
                {t.settingsDescription}
              </p>
            </div>
            <div className="action-card__arrow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
