import { useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import Dropdown from "../components/Dropdown";
import api from "../api/axios";

import "../styles/Settings.css";

interface AdminConfig {
  geminiModel: string;
  aiMock: boolean;
  ocrMock: boolean;
  availableModels: string[];
}

/** Minimal on/off switch, themed via CSS vars (no extra stylesheet needed). */
function Switch({
  checked,
  onChange,
  ariaLabel,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        width: 52,
        height: 30,
        borderRadius: 999,
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: 3,
        opacity: disabled ? 0.6 : 1,
        background: checked
          ? "var(--color-primary, #6366f1)"
          : "var(--color-border, #555)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        transition: "background .2s",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#fff",
          display: "block",
        }}
      />
    </button>
  );
}

export default function AdminSettings() {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AdminConfig>("/admin/settings")
      .then((res) => setConfig(res.data))
      .catch(() => setError(t.adminLoadError));
  }, [t.adminLoadError]);

  const patch = async (
    body: Partial<Pick<AdminConfig, "geminiModel" | "aiMock" | "ocrMock">>,
  ) => {
    if (!config) return;
    const prev = config;
    setConfig({ ...config, ...body }); // optimistic
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await api.patch<AdminConfig>("/admin/settings", body);
      setConfig(res.data);
      setSaved(true);
    } catch {
      setConfig(prev); // rollback
      setError(t.adminSaveError);
    } finally {
      setSaving(false);
    }
  };

  const modelLabel = (m: string) => {
    if (m === "gemini-2.5-flash") return `${m} — ${t.adminModelFlash}`;
    if (m === "gemini-2.5-flash-lite") return `${m} — ${t.adminModelLite}`;
    return m;
  };

  if (!config) {
    return (
      <div className="settings">
        <main className="settings__main">
          {error ? (
            <p className="settings__description">{error}</p>
          ) : (
            <div className="loading-spinner" />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="settings">
      <header className="settings__header">
        <h1 className="settings__title">{t.adminTitle}</h1>
      </header>

      <main className="settings__main">
        <section className="settings__section">
          <h2 className="settings__section-title">🤖 {t.adminAiSection}</h2>

          <div className="settings__card">
            {/* Model */}
            <div className="settings__item">
              <div className="settings__item-label">
                <label className="settings__label">{t.adminModelLabel}</label>
                <p className="settings__description">{t.adminModelDesc}</p>
              </div>
              <div className="settings__item-control">
                <Dropdown<string>
                  value={config.geminiModel}
                  onChange={(v) => patch({ geminiModel: v })}
                  ariaLabel={t.adminModelLabel}
                  minWidth={300}
                  options={config.availableModels.map((m) => ({
                    value: m,
                    label: modelLabel(m),
                  }))}
                />
              </div>
            </div>

            {/* AI mock */}
            <div className="settings__item">
              <div className="settings__item-label">
                <label className="settings__label">{t.adminAiMockLabel}</label>
                <p className="settings__description">{t.adminAiMockDesc}</p>
              </div>
              <div className="settings__item-control">
                <Switch
                  checked={config.aiMock}
                  onChange={(v) => patch({ aiMock: v })}
                  ariaLabel={t.adminAiMockLabel}
                  disabled={saving}
                />
              </div>
            </div>

            {/* OCR mock */}
            <div className="settings__item">
              <div className="settings__item-label">
                <label className="settings__label">{t.adminOcrMockLabel}</label>
                <p className="settings__description">{t.adminOcrMockDesc}</p>
              </div>
              <div className="settings__item-control">
                <Switch
                  checked={config.ocrMock}
                  onChange={(v) => patch({ ocrMock: v })}
                  ariaLabel={t.adminOcrMockLabel}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <p className="settings__description" style={{ marginTop: 12 }}>
            {saving ? t.adminSaving : saved ? t.adminSaved : ""}
            {error ? (
              <span style={{ color: "var(--color-danger, #e5484d)" }}>
                {error}
              </span>
            ) : null}
          </p>
        </section>
      </main>
    </div>
  );
}
