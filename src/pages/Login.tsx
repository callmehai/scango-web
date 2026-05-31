import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import Logo from "../components/Logo";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const { loginWithGoogle, user } = useAuth();
  const [error, setError] = useState(false);

  // Always land on Home after authenticating. We intentionally do NOT restore
  // the pre-login location: it may belong to a previous account (e.g. a
  // conversation owned by another user), which would 404 / fail right after
  // logging in. Home is always valid for any account.
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="auth-page">
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
        <p className="auth-glass__subtitle">{t.authGoogleSubtitle}</p>

        {error && (
          <div className="auth-error" role="alert">
            {t.authLoginGenericError}
          </div>
        )}

        <div className="auth-google">
          <GoogleLogin
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

        <p className="auth-note">{t.authTermsNote}</p>
      </div>
    </div>
  );
}
