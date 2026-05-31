import { useEffect, useState, type ReactNode } from "react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT } from "../constants/uiText";
import api from "../api/axios";
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  Skeleton,
  useToast,
} from "../components/ui";

import "../styles/Profile.css";

interface Usage {
  limited: boolean;
  scansUsed: number;
  scansLimit: number;
  asksUsed: number;
  asksLimit: number;
  resetAtUtc: string;
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="profile__row">
      <span className="profile__label">{label}</span>
      <span className="profile__value">{value}</span>
    </div>
  );
}

export default function Profile() {
  const { systemLang } = useSettings();
  const { user } = useAuth();
  const t = UI_TEXT[systemLang];
  const toast = useToast();

  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageError, setUsageError] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    api
      .get<Usage>("/me/usage")
      .then((res) => setUsage(res.data))
      .catch(() => setUsageError(true));
  }, []);

  if (!user) return null; // ProtectedRoute guarantees a user

  const resendVerify = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      setResent(true);
      toast.success(t.verifySent);
    } catch {
      toast.error(t.authLoginGenericError, { duration: 6000 });
    } finally {
      setResending(false);
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(systemLang === "vi" ? "vi-VN" : "en-US");

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(systemLang === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  const isPaid = user.plan !== "free";

  return (
    <div className="profile">
      {/* Identity */}
      <Card padding="lg">
        <div className="profile__identity">
          <div className="profile__avatar" aria-hidden="true">
            {initial}
          </div>
          <div className="profile__identity-main">
            <h2 className="profile__name">{user.name || user.email}</h2>
            <p className="profile__email">{user.email}</p>
            <div className="profile__badges">
              <Badge variant={isPaid ? "primary" : "neutral"}>
                {user.plan}
              </Badge>
              <Badge variant={user.role === "admin" ? "warning" : "neutral"}>
                {user.role}
              </Badge>
              {user.emailVerified ? (
                <Badge variant="success" dot>
                  {t.profileVerifiedYes}
                </Badge>
              ) : (
                <Badge variant="warning" dot>
                  {t.profileVerifiedNo}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Account info */}
      <Card padding="md">
        <h3 className="profile__section-title">{t.profileAccount}</h3>
        <div className="profile__list">
          <Row label={t.profileEmail} value={user.email} />
          <Row label={t.profileName} value={user.name || "—"} />
          <Row label={t.profileRole} value={user.role} />
          <Row label={t.profilePlan} value={user.plan} />
          <Row label={t.profileMemberSince} value={fmtDate(user.createdAt)} />
        </div>
      </Card>

      {/* Verify email — only when not verified */}
      {!user.emailVerified && (
        <Card padding="md">
          <h3 className="profile__section-title">{t.profileEmailVerified}</h3>
          <div className="profile__verify">
            <p className="profile__verify-text">{t.authVerifyEmailHint}</p>
            <Button
              variant="primary"
              size="sm"
              loading={resending}
              disabled={resent}
              onClick={resendVerify}
            >
              {resent ? t.verifySent : t.verifyResend}
            </Button>
          </div>
        </Card>
      )}

      {/* Quota */}
      <Card padding="md">
        <div className="profile__quota-head">
          <h3 className="profile__section-title">{t.profileQuota}</h3>
        </div>

        {usageError ? (
          <p className="profile__verify-text">{t.adminLoadError}</p>
        ) : usage === null ? (
          <div className="profile__quota-loading">
            <Skeleton width="40%" height={16} />
            <Skeleton width="100%" height={10} />
            <Skeleton width="40%" height={16} />
            <Skeleton width="100%" height={10} />
          </div>
        ) : usage.limited ? (
          <div className="profile__quota-bars">
            <ProgressBar
              value={usage.scansUsed}
              max={usage.scansLimit}
              tone="auto"
              label={t.profileQuotaScans}
              leftMeta={t.profileQuotaScans}
              rightMeta={`${usage.scansUsed} / ${usage.scansLimit}`}
            />
            <ProgressBar
              value={usage.asksUsed}
              max={usage.asksLimit}
              tone="auto"
              label={t.profileQuotaAsks}
              leftMeta={t.profileQuotaAsks}
              rightMeta={`${usage.asksUsed} / ${usage.asksLimit}`}
            />
            <Row label={t.profileQuotaReset} value={fmt(usage.resetAtUtc)} />
          </div>
        ) : (
          <p className="profile__verify-text">{t.profileUnlimited}</p>
        )}
      </Card>
    </div>
  );
}
