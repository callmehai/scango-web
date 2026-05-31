import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import api from "../api/axios";
import Logo from "../components/Logo";
import { Button, EmptyState, ErrorState, Spinner } from "../components/ui";
import "../styles/Auth.css";

type VerifyState = "loading" | "ok" | "error";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<VerifyState>("loading");
  // bumping this re-runs the verification effect (retry without losing token)
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      setState("error");
      return;
    }
    let cancelled = false;
    setState("loading");
    api
      .post("/auth/verify-email", { token })
      .then(() => {
        if (!cancelled) setState("ok");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token, attempt]);

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

        <div className="auth-status">
          {state === "loading" && (
            <>
              <div className="auth-status__spinner">
                <Spinner size="lg" label={t.verifyLoading} />
              </div>
              <h1 className="auth-glass__title">{t.verifyLoading}</h1>
            </>
          )}

          {state === "ok" && (
            <EmptyState
              icon="✅"
              title={t.verifySuccess}
              description={t.profileEmailVerified}
              action={
                <div className="auth-actions">
                  <Button fullWidth onClick={() => navigate("/", { replace: true })}>
                    {t.backHome}
                  </Button>
                </div>
              }
            />
          )}

          {state === "error" && (
            <ErrorState
              icon="⚠️"
              title={t.verifyErrorTitle}
              message={t.verifyError}
              {...(token
                ? { onRetry: () => setAttempt((n) => n + 1), retryLabel: t.commonRetry }
                : {})}
            />
          )}

          {state === "error" && (
            <div className="auth-actions">
              <Button
                variant="ghost"
                fullWidth
                onClick={() => navigate("/login", { replace: true })}
              >
                {t.authLoginTitle}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
