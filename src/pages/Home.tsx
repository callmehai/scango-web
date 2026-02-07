import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const { systemLang, theme, toggleTheme } = useSettings();
  const t = UI_TEXT[systemLang];

  return (
    <div className="home">
      {/* Theme Toggle & Settings buttons */}
      <div className="home__top-actions">
        <button
          className="home__theme-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
        >
          {theme === "light" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
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
          className="home__settings-btn"
          onClick={() => navigate("/settings")}
          aria-label={t.settings}
          title={t.settings}
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
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Background decorative elements */}
      <div className="home__background">
        <div className="gradient-orb gradient-orb--1"></div>
        <div className="gradient-orb gradient-orb--2"></div>
        <div className="gradient-orb gradient-orb--3"></div>
      </div>

      {/* Main Content */}
      <div className="home__container">
        {/* Hero Section */}
        <header className="home__header">
          <div className="home__logo-wrapper">
            <div className="home__logo">
              <img
                src={
                  theme === "light"
                    ? "/assets/ScanGoLogo.png"
                    : "/assets/ScanGoLogoDark.png"
                }
                alt="App Logo"
                className="home__logo-image"
              />
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
        </section>

        {/* Features Grid */}
        <section className="home__features">
          <div className="feature-card">
            <div className="feature-card__icon">⚡</div>
            <h4 className="feature-card__title">{t.benefitFast}</h4>
            <p className="feature-card__text">{t.benefitFastDescription}</p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">🎯</div>
            <h4 className="feature-card__title">{t.benefitAccurate}</h4>
            <p className="feature-card__text">{t.benefitAccurateDescription}</p>
          </div>

          <div className="feature-card">
            <div className="feature-card__icon">🔒</div>
            <h4 className="feature-card__title">{t.benefitPrivate}</h4>
            <p className="feature-card__text">{t.benefitPrivateDescription}</p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="home__stats">
          <div className="stat-item">
            <div className="stat-item__value">99.9%</div>
            <div className="stat-item__label">{t.statAccuracy}</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-item__value">&lt;10s</div>
            <div className="stat-item__label">{t.statSpeed}</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-item__value">20+</div>
            <div className="stat-item__label">{t.statConversations}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
