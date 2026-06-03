import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT } from "../constants/uiText";
import api from "../api/axios";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  ProgressBar,
  Skeleton,
  useToast,
} from "../components/ui";

import "../styles/Profile.css";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
// Keep in sync with backend UpdateProfileRequest: [StringLength(100, MinimumLength = 1)]
const MAX_NAME_CHARS = 100;

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

  // ----- edit-profile modal (name + avatar) -----
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  // ----- avatar -----
  const hasAvatar = user?.hasAvatar ?? false;
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

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

  const openEdit = () => {
    setNameDraft(user.name || "");
    setEditing(true);
  };

  const closeEdit = () => {
    if (savingName || avatarBusy) return; // don't close mid-request
    setEditing(false);
  };

  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next || next === user.name) {
      setEditing(false);
      return;
    }
    setSavingName(true);
    try {
      await api.patch("/me", { name: next });
      await refreshMe();
      toast.success(t.profileNameSaved);
      setEditing(false);
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
          <div className="profile__avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="profile__avatar-img" />
            ) : (
              <span aria-hidden="true">{initial}</span>
            )}
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
          <Button
            className="profile__edit-btn"
            variant="secondary"
            size="sm"
            onClick={openEdit}
          >
            {t.profileEdit}
          </Button>
        </div>
      </Card>

      {/* Edit-profile modal: avatar + display name */}
      <Modal
        open={editing}
        onClose={closeEdit}
        title={t.profileEditTitle}
        size="sm"
        closeLabel={t.profileCancel}
        footer={
          <>
            <Button
              variant="ghost"
              disabled={savingName || avatarBusy}
              onClick={closeEdit}
            >
              {t.profileCancel}
            </Button>
            <Button
              variant="primary"
              loading={savingName}
              disabled={avatarBusy}
              onClick={saveName}
            >
              {t.profileSave}
            </Button>
          </>
        }
      >
        <div className="profile-edit">
          <div className="profile-edit__avatar-block">
            <div className="profile-edit__avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="profile-edit__avatar-img"
                />
              ) : (
                <span aria-hidden="true">{initial}</span>
              )}
            </div>
            <div className="profile-edit__avatar-actions">
              <Button
                size="sm"
                variant="secondary"
                loading={avatarBusy}
                onClick={() => fileRef.current?.click()}
              >
                {t.profileChangeAvatar}
              </Button>
              {hasAvatar && (
                <Button
                  size="sm"
                  variant="danger"
                  disabled={avatarBusy}
                  onClick={() => setConfirmRemove(true)}
                >
                  {t.profileRemoveAvatar}
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onAvatarFile}
            />
          </div>

          <div className="profile-edit__name">
            <Field label={t.profileName}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={MAX_NAME_CHARS}
                  autoFocus
                />
              )}
            </Field>
            <div className="profile-edit__charcount" aria-live="polite">
              {nameDraft.length}/{MAX_NAME_CHARS}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={async () => {
          await removeAvatar();
          setConfirmRemove(false);
        }}
        tone="danger"
        title={t.profileRemoveAvatarTitle}
        message={t.profileRemoveAvatarConfirm}
        confirmLabel={t.profileRemoveAvatar}
        cancelLabel={t.profileCancel}
        closeLabel={t.profileCancel}
      />

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
