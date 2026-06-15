import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT } from "../constants/uiText";
import { Card, ErrorState, Field, Spinner, useToast } from "../components/ui";
import api from "../api/axios";

import "../styles/Admin.css";

interface AdminConfig {
  geminiModel: string;
  aiMock: boolean;
  ocrMock: boolean;
  ttsMock: boolean;
  availableModels: string[];
}

/** Minimal on/off switch, themed via CSS tokens. */
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
      className="admin-switch"
    >
      <span className="admin-switch__knob" />
    </button>
  );
}

export default function AdminSettings() {
  const { systemLang } = useSettings();
  const { user } = useAuth();
  const t = UI_TEXT[systemLang];
  const toast = useToast();
  // Testers can view this page but not change anything.
  const canManage = user?.role === "admin";

  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    api
      .get<AdminConfig>("/admin/settings")
      .then((res) => setConfig(res.data))
      .catch(() => setError(t.adminLoadError));
  };

  useEffect(() => {
    load();
    // Load once on mount — don't refetch just because the language changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = async (
    body: Partial<
      Pick<AdminConfig, "geminiModel" | "aiMock" | "ocrMock" | "ttsMock">
    >,
  ) => {
    if (!config || !canManage) return;
    const prev = config;
    setConfig({ ...config, ...body }); // optimistic
    setSaving(true);
    setError(null);
    try {
      const res = await api.patch<AdminConfig>("/admin/settings", body);
      setConfig(res.data);
      toast.success(t.adminSaved);
    } catch {
      setConfig(prev); // rollback
      toast.error(t.adminSaveError);
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
    if (error) {
      return (
        <div className="admin-page">
          <ErrorState message={error} onRetry={load} retryLabel={t.commonRetry} />
        </div>
      );
    }
    return (
      <div className="admin-state">
        <Spinner size="lg" label={t.adminTitle} />
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Link to user management */}
      <Link to="/admin/users" className="admin-link-anchor">
        <Card interactive padding="md" className="admin-link-card">
          <span className="admin-link-card__text">
            <span className="admin-link-card__title">{t.adminUsersTitle}</span>
            <span className="admin-link-card__desc">{t.adminSearchUser}</span>
          </span>
          <span className="admin-link-card__arrow" aria-hidden="true">
            →
          </span>
        </Card>
      </Link>

      {/* Link to payments */}
      <Link to="/admin/payments" className="admin-link-anchor">
        <Card interactive padding="md" className="admin-link-card">
          <span className="admin-link-card__text">
            <span className="admin-link-card__title">{t.adminPaymentsTitle}</span>
            <span className="admin-link-card__desc">{t.adminPaymentsDesc}</span>
          </span>
          <span className="admin-link-card__arrow" aria-hidden="true">
            →
          </span>
        </Card>
      </Link>

      {/* Link to revenue */}
      <Link to="/admin/revenue" className="admin-link-anchor">
        <Card interactive padding="md" className="admin-link-card">
          <span className="admin-link-card__text">
            <span className="admin-link-card__title">{t.adminRevenueTitle}</span>
            <span className="admin-link-card__desc">{t.adminRevenueDesc}</span>
          </span>
          <span className="admin-link-card__arrow" aria-hidden="true">
            →
          </span>
        </Card>
      </Link>

      {/* AI configuration */}
      <Card as="section" padding="lg" className="admin-section">
        <h2 className="admin-section__title">
          <span aria-hidden="true">🤖</span> {t.adminAiSection}
        </h2>

        {/* Model */}
        <Field label={t.adminModelLabel} hint={t.adminModelDesc}>
          {({ id, describedBy }) => (
            <select
              id={id}
              aria-describedby={describedBy}
              className="admin-select"
              value={config.geminiModel}
              disabled={saving || !canManage}
              aria-label={t.adminModelLabel}
              onChange={(e) => patch({ geminiModel: e.target.value })}
            >
              {config.availableModels.map((m) => (
                <option key={m} value={m}>
                  {modelLabel(m)}
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* AI mock */}
        <div className="admin-switch-row">
          <span className="admin-switch-row__text">
            <span className="admin-switch-row__label">{t.adminAiMockLabel}</span>
            <span className="admin-switch-row__desc">{t.adminAiMockDesc}</span>
          </span>
          <Switch
            checked={config.aiMock}
            onChange={(v) => patch({ aiMock: v })}
            ariaLabel={t.adminAiMockLabel}
            disabled={saving || !canManage}
          />
        </div>

        {/* OCR mock */}
        <div className="admin-switch-row">
          <span className="admin-switch-row__text">
            <span className="admin-switch-row__label">{t.adminOcrMockLabel}</span>
            <span className="admin-switch-row__desc">{t.adminOcrMockDesc}</span>
          </span>
          <Switch
            checked={config.ocrMock}
            onChange={(v) => patch({ ocrMock: v })}
            ariaLabel={t.adminOcrMockLabel}
            disabled={saving || !canManage}
          />
        </div>

        {/* TTS — positive framing: ON = real Google voice (ttsMock=false) */}
        <div className="admin-switch-row">
          <span className="admin-switch-row__text">
            <span className="admin-switch-row__label">{t.adminTtsLabel}</span>
            <span className="admin-switch-row__desc">{t.adminTtsDesc}</span>
          </span>
          <Switch
            checked={!config.ttsMock}
            onChange={(v) => patch({ ttsMock: !v })}
            ariaLabel={t.adminTtsLabel}
            disabled={saving || !canManage}
          />
        </div>

        {saving && (
          <p className="admin-saving-hint" role="status">
            <Spinner size="sm" /> {t.adminSaving}
          </p>
        )}
      </Card>
    </div>
  );
}
