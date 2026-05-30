import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import Logo from "../components/Logo";
import "../styles/Auth.css";
import axios from "axios";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const { login, user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /**
   * Discriminated union so lang switch re-translates the fallback message at
   * render time (storing a translated string would freeze it in state).
   */
  const [error, setError] = useState<
    { kind: "generic" } | { kind: "msg"; text: string } | null
  >(null);
  const errorText = !error
    ? null
    : error.kind === "msg"
      ? error.text                       // backend-supplied message
      : t.authLoginGenericError;         // re-translates when lang changes

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError({ kind: "msg", text: String(err.response.data.message) });
      } else {
        setError({ kind: "generic" });
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo height={56} className="auth-card__logo" />
        <h1 className="auth-card__title">{t.authLoginTitle}</h1>
        <p className="auth-card__subtitle">{t.authLoginSubtitle}</p>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <span>{t.authEmail}</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@scango.vn"
            />
          </label>

          <label className="auth-field">
            <span>{t.authPassword}</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {errorText && (
            <div className="auth-error" role="alert">
              {errorText}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t.authSubmitting : t.authLoginBtn}
          </button>
        </form>

        <p className="auth-switch">
          {t.authNoAccount}{" "}
          <Link to="/register">{t.authRegisterBtn}</Link>
        </p>
      </div>
    </div>
  );
}
