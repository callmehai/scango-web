import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import { Button, Field, Input } from "../components/ui";
import Logo from "../components/Logo";
import AuthTopControls from "../components/AuthTopControls";
import InAppBrowserNotice from "../components/InAppBrowserNotice";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const { login, loginWithGoogle, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  // Always land on Home after authenticating. We intentionally do NOT restore
  // the pre-login location: it may belong to a previous account (e.g. a
  // conversation owned by another user), which would 404 / fail right after
  // logging in. Home is always valid for any account.
  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(false);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthTopControls />

      {/* animated ambient background */}
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

        <h1 className="auth-glass__title">{t.authLoginTitle}</h1>
        <p className="auth-glass__subtitle">{t.authLoginSubtitle}</p>

        <InAppBrowserNotice />

        {error && (
          <div className="auth-error" role="alert">
            {t.authLoginGenericError}
          </div>
        )}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
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

          <Field label={t.authPassword}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            )}
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? t.authSubmitting : t.authLoginBtn}
          </Button>
        </form>

        <div className="auth-divider">
          <span>{t.authOr}</span>
        </div>

        <div className="auth-google">
          <GoogleLogin
            // Remount when the app language changes so Google re-renders the
            // button in the locale set on <GoogleOAuthProvider> (the GSI
            // iframe caches its label per mount).
            key={systemLang}
            onSuccess={async (cred) => {
              if (!cred.credential) return;
              setError(false);
              try {
                await loginWithGoogle(cred.credential);
                navigate("/", { replace: true });
              } catch {
                setError(true);
              }
            }}
            onError={() => setError(true)}
            text="continue_with"
            shape="pill"
            size="large"
            width="300"
            theme="filled_blue"
            logo_alignment="left"
          />
        </div>

        <p className="auth-switch">
          {t.authNoAccount}{" "}
          <Link to="/register" className="auth-switch__link">
            {t.authRegisterBtn}
          </Link>
        </p>

        <p className="auth-note">{t.authTermsNote}</p>
      </div>
    </div>
  );
}
