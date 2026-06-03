import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { SETTINGS_LANGUAGES } from "../constants/settingsLanguages";
import { LANGUAGE_MAP, type TargetLanguage } from "../constants/languages";
import { UI_TEXT } from "../constants/uiText";
import Dropdown from "../components/Dropdown";
import { Button, Card } from "../components/ui";

import "../styles/Settings.css";

const APP_VERSION = "1.0.0";

// Plan catalogue — mirrors scango-api Features/Billing/Plans.cs (display only).
// Every plan has a weekly quota. "tester" is a ROLE, not a plan, so it's absent.
const PLANS = [
  {
    code: "free",
    name: "Free",
    price: "0đ",
    duration: null,
    limitKey: "plansLimitFree",
  },
  {
    code: "lite",
    name: "Lite",
    price: "29.000đ",
    duration: "plansDuration7",
    limitKey: "plansLimitBasic",
  },
  {
    code: "basic_monthly",
    name: "Basic",
    price: "49.000đ",
    duration: "plansDuration30",
    limitKey: "plansLimitBasic",
  },
  {
    code: "pro_monthly",
    name: "Pro",
    price: "149.000đ",
    duration: "plansDuration30",
    limitKey: "plansLimitPro",
  },
  {
    code: "pro_yearly",
    name: "Max",
    price: "1.290.000đ",
    duration: "plansDuration365",
    limitKey: "plansLimitPro",
  },
  // "Unlimited" is an internal-only ceiling (staff get unlimited via role), not
  // a real plan — keep it out of the user-facing pricing list.
] as const;

export default function Settings() {
  const { targetLang, setTargetLang, systemLang, setSystemLang, theme, setTheme } =
    useSettings();

  const t = UI_TEXT[systemLang];
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="settings">
      {/* Language */}
      <section className="settings__section">
        <h2 className="settings__section-title">{t.languageTitle}</h2>

        <Card padding="md">
          {/* System language — binary toggle (segmented control) */}
          <div className="settings__item">
            <div className="settings__item-label">
              <span className="settings__label">{t.systemLangLabel}</span>
              <p className="settings__description">{t.systemLangDesc}</p>
            </div>

            <div
              className="settings__segmented"
              role="group"
              aria-label={t.systemLangLabel}
            >
              <Button
                variant={systemLang === "vi" ? "primary" : "subtle"}
                size="sm"
                aria-pressed={systemLang === "vi"}
                onClick={() => setSystemLang("vi")}
              >
                🇻🇳 {t.langVi}
              </Button>
              <Button
                variant={systemLang === "en" ? "primary" : "subtle"}
                size="sm"
                aria-pressed={systemLang === "en"}
                onClick={() => setSystemLang("en")}
              >
                🇺🇸 {t.langEn}
              </Button>
            </div>
          </div>

          {/* Target translation language — many options → keep Dropdown */}
          <div className="settings__item">
            <div className="settings__item-label">
              <span className="settings__label">{t.targetLangLabel}</span>
              <p className="settings__description">{t.targetLangDesc}</p>
            </div>

            <div className="settings__item-control">
              <Dropdown<TargetLanguage>
                value={targetLang}
                onChange={setTargetLang}
                ariaLabel={t.targetLangLabel}
                minWidth={260}
                searchable
                searchPlaceholder={t.dropdownSearchPlaceholder}
                noResultsLabel={t.dropdownNoResults}
                options={SETTINGS_LANGUAGES.filter((code) => code !== "auto").map(
                  (code) => {
                    const lang = LANGUAGE_MAP[code];
                    return {
                      value: code,
                      label: `${lang.flag} ${lang.label}`,
                    };
                  },
                )}
              />
            </div>
          </div>
        </Card>
      </section>

      {/* Appearance — theme toggle (consistent segmented control) */}
      <section className="settings__section">
        <h2 className="settings__section-title">{t.appearanceTitle}</h2>

        <Card padding="md">
          <div className="settings__item">
            <div className="settings__item-label">
              <span className="settings__label">{t.themeLabel}</span>
              <p className="settings__description">{t.themeDesc}</p>
            </div>

            <div
              className="settings__segmented"
              role="group"
              aria-label={t.themeLabel}
            >
              <Button
                variant={theme === "light" ? "primary" : "subtle"}
                size="sm"
                aria-pressed={theme === "light"}
                onClick={() => setTheme("light")}
              >
                ☀️ {t.themeLight}
              </Button>
              <Button
                variant={theme === "dark" ? "primary" : "subtle"}
                size="sm"
                aria-pressed={theme === "dark"}
                onClick={() => setTheme("dark")}
              >
                🌙 {t.themeDark}
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Admin — visible to admin + tester (tester sees a read-only view) */}
      {(user?.role === "admin" || user?.role === "tester") && (
        <section className="settings__section">
          <h2 className="settings__section-title">{t.adminTitle}</h2>
          <Card padding="md">
            <div className="settings__item">
              <div className="settings__item-label">
                <span className="settings__label">{t.adminAiSection}</span>
                <p className="settings__description">{t.adminModelDesc}</p>
              </div>
              <div className="settings__item-control">
                <Button
                  as="a"
                  href="/admin"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin");
                  }}
                >
                  {t.adminOpenLink}
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* App info */}
      <section className="settings__section">
        <h2 className="settings__section-title">{t.infoTitle}</h2>

        <Card padding="md">
          <div className="settings__info">
            <p className="settings__info-text">
              <strong>{t.appName}</strong>
              <span className="settings__info-version">v{APP_VERSION}</span>
            </p>
            <p className="settings__info-text">{t.appDesc}</p>
            <p className="settings__info-text settings__info-muted">
              {t.appSubDesc}
            </p>
          </div>
        </Card>
      </section>

      {/* Plans / pricing */}
      <section className="settings__section">
        <h2 className="settings__section-title">{t.plansTitle}</h2>

        <Card padding="md">
          <ul className="settings__plans">
            {PLANS.map((plan) => {
              const isCurrent = (user?.plan ?? "free") === plan.code;
              return (
                <li
                  key={plan.code}
                  className={`settings__plan${isCurrent ? " settings__plan--current" : ""}`}
                >
                  <div className="settings__plan-main">
                    <span className="settings__plan-name">
                      {plan.name}
                      {isCurrent && (
                        <span className="settings__plan-badge">
                          {t.plansCurrentBadge}
                        </span>
                      )}
                    </span>
                    <span className="settings__plan-limit">{t[plan.limitKey]}</span>
                  </div>
                  <div className="settings__plan-price">
                    <span className="settings__plan-price-value">{plan.price}</span>
                    {plan.duration && (
                      <span className="settings__plan-price-unit">
                        {t[plan.duration]}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="settings__plans-note">{t.plansNote}</p>
        </Card>
      </section>
    </div>
  );
}
