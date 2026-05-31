import { Navigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import Logo from "../components/Logo";
import { Spinner } from "../components/ui";
import "../styles/Auth.css";

// Google sign-in handles both sign-in and sign-up, so there's a single auth
// entry point. /register just redirects to /login. We render the shared auth
// glass shell with a spinner so the (near-instant) redirect stays visually
// consistent with the rest of the auth surface.
export default function Register() {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  return (
    <>
      <Navigate to="/login" replace />
      <div className="auth-page">
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

          <div className="auth-status">
            <div className="auth-status__spinner">
              <Spinner size="lg" label={t.authRegisterRedirect} />
            </div>
            <p className="auth-glass__subtitle">{t.authRegisterRedirect}</p>
          </div>
        </div>
      </div>
    </>
  );
}
