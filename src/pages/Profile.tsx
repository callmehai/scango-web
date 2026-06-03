import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT } from "../constants/uiText";
import api from "../api/axios";
import {
  Badge,
  Button,
  Card,
  Input,
  ProgressBar,
  Skeleton,
  useToast,
} from "../components/ui";

import "../styles/Profile.css";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

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
  const { user, refreshMe } = useAuth();
  const t = UI_TEXT[systemLang];
  const toast = useToast();

  const [usage, setUsage] = useState<Usage | null>(null);
  const [usageError, setUsageError] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // ----- name editing -----
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  // ----- avatar -----
  const hasAvatar = user?.hasAvatar ?? false;
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    api
      .get<Usage>("/me/usage")
      .then((res) => setUsage(res.data))
      .catch(() => setUsageError(true));
  }, []);

  // The avatar endpoint is authenticated, so an <img src> can't carry the
  // bearer token — fetch it as a blob and hand the <img> an object URL.
  useEffect(() => {
    if (!hasAvatar) {
      setAvatarUrl(null);
      return;
    }
    let cancelled = false;
    let objUrl: string | null = null;
    api
      .get("/me/avatar", { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objUrl = URL.createObjectURL(res.data as Blob);
        setAvatarUrl(objUrl);
      })
      .catch(() => !cancelled && setAvatarUrl(null));
    return () => {
      cancelled = true;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [hasAvatar, avatarVersion]);

  if (!user) return null; // ProtectedRoute guarantees a user

  const startEditName = () => {
    setNameDraft(user.name || "");
    setEditingName(true);
  };

  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next || next === user.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      await api.patch("/me", { name: next });
      await refreshMe();
      toast.success(t.profileNameSaved);
      setEditingName(false);
    } catch {
      toast.error(t.profileNameError);
    } finally {
      setSavingName(false);
    }
  };

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error(t.profileAvatarNotImage);
      return;
    }
    if (f.size > MAX_AVATAR_BYTES) {
      toast.error(t.profileAvatarTooLarge);
      return;
    }
    setAvatarBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      await api.post("/me/avatar", fd);
      await refreshMe();
      setAvatarVersion((v) => v + 1); // force re-fetch even if hasAvatar already true
      toast.success(t.profileAvatarSaved);
    } catch {
      toast.error(t.profileAvatarError);
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    try {
      await api.delete("/me/avatar");
      await refreshMe();
      setAvatarUrl(null);
      toast.success(t.profileAvatarRemoved);
    } catch {
      toast.error(t.profileAvatarError);
    } finally {
      setAvatarBusy(false);
    }
  };

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
          <div className="profile__avatar-wrap">
            <button
              type="button"
              className="profile__avatar"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label={t.profileChangeAvatar}
              title={t.profileChangeAvatar}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="profile__avatar-img"
                />
              ) : (
                <span aria-hidden="true">{initial}</span>
              )}
              <span className="profile__avatar-overlay" aria-hidden="true">
                ✎
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onAvatarFile}
            />
            <div className="profile__avatar-actions">
              <button
                type="button"
                className="profile__link-btn"
                onClick={() => fileRef.current?.click()}
                disabled={avatarBusy}
              >
                {t.profileChangeAvatar}
              </button>
              {hasAvatar && (
                <button
                  type="button"
                  className="profile__link-btn profile__link-btn--danger"
                  onClick={removeAvatar}
                  disabled={avatarBusy}
                >
                  {t.profileRemoveAvatar}
                </button>
              )}
            </div>
          </div>
          <div className="profile__identity-main">
            {editingName ? (
              <div className="profile__name-edit">
                <Input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={100}
                  autoFocus
                  aria-label={t.profileName}
                />
                <div className="profile__name-actions">
                  <Button
                    size="sm"
                    variant="primary"
                    loading={savingName}
                    onClick={saveName}
                  >
                    {t.profileSave}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={savingName}
                    onClick={() => setEditingName(false)}
                  >
                    {t.profileCancel}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="profile__name-row">
                <h2 className="profile__name">{user.name || user.email}</h2>
                <button
                  type="button"
                  className="profile__link-btn"
                  onClick={startEditName}
                >
                  {t.profileEdit}
                </button>
              </div>
            )}
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
