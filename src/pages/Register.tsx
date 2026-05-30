import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import Logo from "../components/Logo";
import "../styles/Auth.css";
import axios from "axios";

export default function Register() {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const { register, user, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  /** See Login.tsx — keep raw kind so lang switch re-translates live. */
  const [error, setError] = useState<
    | { kind: "generic" }
    | { kind: "termsRequired" }
    | { kind: "msg"; text: string }
    | null
  >(null);
  const errorText = !error
    ? null
    : error.kind === "msg"
      ? error.text
      : error.kind === "termsRequired"
        ? t.authMustAcceptTerms
        : t.authRegisterGenericError;

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError({ kind: "termsRequired" });
      return;
    }
    try {
      await register(email.trim(), password, name.trim());
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
        <h1 className="auth-card__title">{t.authRegisterTitle}</h1>
        <p className="auth-card__subtitle">{t.authRegisterSubtitle}</p>

        <form className="auth-form" onSubmit={submit}>
          <label className="auth-field">
            <span>{t.authName}</span>
            <input
              type="text"
              autoComplete="name"
              required
              minLength={1}
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>{t.authEmail}</span>
            <input
              type="email"
              autoComplete="email"
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
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.authPasswordHint}
            />
          </label>

          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>{t.authAcceptTerms}</span>
          </label>

          {errorText && (
            <div className="auth-error" role="alert">
              {errorText}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t.authSubmitting : t.authRegisterBtn}
          </button>
        </form>

        <p className="auth-switch">
          {t.authHaveAccount} <Link to="/login">{t.authLoginBtn}</Link>
        </p>
      </div>
    </div>
  );
}
