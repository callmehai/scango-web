import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import { Button, Field, Input } from "../components/ui";
import Logo from "../components/Logo";
import AuthTopControls from "../components/AuthTopControls";
import InAppBrowserNotice from "../components/InAppBrowserNotice";
import "../styles/Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const { register, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!accepted) {
      setError(t.authMustAcceptTerms);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      navigate("/", { replace: true });
    } catch {
      setError(t.authRegisterGenericError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthTopControls />

      <div className="auth-bg" aria-hidden="true">
        <span className="auth-blob auth-blob--1" />
        <span className="auth-blob auth-blob--2" />
        <span className="auth-blob auth-blob--3" />
      </div>

      <div className="auth-glass">
        <div className="auth-logo-float">
          <Logo height={64} iconOnly className="auth-logo-float__icon" />
        </div>
        <span className="auth-wordmark">{t.appName}</span>

        <h1 className="auth-glass__title">{t.authRegisterTitle}</h1>
        <p className="auth-glass__subtitle">{t.authRegisterSubtitle}</p>

        <InAppBrowserNotice />

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <Field label={t.authName}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
          </Field>

          <Field label={t.authEmail}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </Field>

          <Field label={t.authPassword} hint={t.authPasswordHint}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
          </Field>

          <label className="auth-terms">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{t.authAcceptTerms}</span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? t.authSubmitting : t.authRegisterBtn}
          </Button>
        </form>

        <p className="auth-switch">
          {t.authHaveAccount}{" "}
          <Link to="/login" className="auth-switch__link">
            {t.authLoginBtn}
          </Link>
        </p>

        <p className="auth-note">{t.authTermsNote}</p>
      </div>
    </div>
  );
}
