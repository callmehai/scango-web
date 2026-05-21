import { useSettings } from "../hooks/useSettings";
import { SETTINGS_LANGUAGES } from "../constants/settingsLanguages";
import { LANGUAGE_MAP, type TargetLanguage } from "../constants/languages";
import { UI_TEXT } from "../constants/uiText";
import Dropdown from "../components/Dropdown";

import "../styles/Settings.css";

export default function Settings() {
  const { targetLang, setTargetLang, systemLang, setSystemLang } =
    useSettings();

  const t = UI_TEXT[systemLang];

  return (
    <div className="settings">
      {/* Header — back rendered globally via <BackButton /> */}
      <header className="settings__header">
        <h1 className="settings__title">{t.settingsTitle}</h1>
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
                <Dropdown<"vi" | "en">
                  value={systemLang}
                  onChange={setSystemLang}
                  ariaLabel={t.systemLangLabel}
                  minWidth={220}
                  options={[
                    { value: "vi", label: `🇻🇳 ${t.langVi}` },
                    { value: "en", label: `🇺🇸 ${t.langEn}` },
                  ]}
                />
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
                <Dropdown<TargetLanguage>
                  value={targetLang}
                  onChange={setTargetLang}
                  ariaLabel={t.targetLangLabel}
                  minWidth={260}
                  options={SETTINGS_LANGUAGES.filter(
                    (code) => code !== "auto",
                  ).map((code) => {
                    const lang = LANGUAGE_MAP[code];
                    return {
                      value: code,
                      label: `${lang.flag} ${lang.label}`,
                    };
                  })}
                />
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
