import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { SETTINGS_LANGUAGES } from "../constants/settingsLanguages";
import { LANGUAGE_MAP, type TargetLanguage } from "../constants/languages";
import { UI_TEXT } from "../constants/uiText";

import "../styles/Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { targetLang, setTargetLang, systemLang, setSystemLang } =
    useSettings();

  const t = UI_TEXT[systemLang];

  return (
    <div className="settings">
      {/* Header */}
      <header className="settings__header">
        <h1 className="settings__title">{t.settingsTitle}</h1>
        <button
          className="history__back-btn"
          onClick={() => navigate("/")}
          aria-label={t.backHome}
          title={t.backHome}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main className="settings__main">
        {/* Language */}
        <section className="settings__section">
          <h2 className="settings__section-title">🌍 {t.languageTitle}</h2>

          <div className="settings__card">
            {/* System language */}
            <div className="settings__item">
              <div className="settings__item-label">
                <label htmlFor="system-lang" className="settings__label">
                  {t.systemLangLabel}
                </label>
                <p className="settings__description">{t.systemLangDesc}</p>
              </div>

              <div className="settings__item-control">
                <select
                  id="system-lang"
                  className="settings__select"
                  value={systemLang}
                  onChange={(e) => setSystemLang(e.target.value as "vi" | "en")}
                >
                  <option value="vi">🇻🇳 {t.langVi}</option>
                  <option value="en">🇺🇸 {t.langEn}</option>
                </select>
              </div>
            </div>

            {/* Target translation language */}
            <div className="settings__item">
              <div className="settings__item-label">
                <label htmlFor="target-lang" className="settings__label">
                  {t.targetLangLabel}
                </label>
                <p className="settings__description">{t.targetLangDesc}</p>
              </div>

              <div className="settings__item-control">
                <select
                  id="target-lang"
                  className="settings__select"
                  value={targetLang}
                  onChange={(e) =>
                    setTargetLang(e.target.value as TargetLanguage)
                  }
                >
                  {SETTINGS_LANGUAGES.filter((code) => code !== "auto").map(
                    (code) => {
                      const lang = LANGUAGE_MAP[code];
                      return (
                        <option key={code} value={code}>
                          {lang.flag} {lang.label}
                        </option>
                      );
                    },
                  )}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Info */}
        <section className="settings__section">
          <h2 className="settings__section-title">ℹ️ {t.infoTitle}</h2>

          <div className="settings__card">
            <div className="settings__info">
              <p className="settings__info-text">
                <strong>{t.appName} v1.0</strong>
              </p>
              <p className="settings__info-text">{t.appDesc}</p>
              <p className="settings__info-text settings__info-muted">
                {t.appSubDesc}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
