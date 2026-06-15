import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import type { TargetLanguage } from "../constants/languages";
import { LANGUAGE_MAP } from "../constants/languages";
import { TOPIC_OPTIONS, TRANSLATION_LANGS } from "../constants/scan";
import { UI_TEXT } from "../constants/uiText";
import Dropdown from "../components/Dropdown";
import { Card, Field, Button, ErrorState, Spinner, useToast } from "../components/ui";
import "../styles/Scan.css";

type DocumentTopic = "product" | "history" | "place" | "general";

export default function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const {
    systemLang,
    targetLang: savedTargetLang,
    setTargetLang: updateGlobalTargetLang,
  } = useSettings();
  const t = UI_TEXT[systemLang];
  const toast = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [topic, setTopic] = useState<DocumentTopic>(() => {
    const saved = localStorage.getItem("lastSelectedTopic");
    if (
      saved === "product" ||
      saved === "history" ||
      saved === "place" ||
      saved === "general"
    ) {
      return saved;
    }
    return "general";
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [scanQuotaReached, setScanQuotaReached] = useState(false);

  // The OCR + conversation-create call is a single blocking request with no
  // progress events, so cycle reassuring status copy on a timer (holding on the
  // last message) instead of showing one frozen "Processing…" for 5–30s.
  // `stage` is reset to 0 at submit time (see onSubmit), so the effect only owns
  // the interval and never calls setState synchronously in its body.
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setStage((s) => Math.min(s + 1, 2)), 3000);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    localStorage.setItem("lastSelectedTopic", topic);
  }, [topic]);

  // Disable scanning up-front when this week's scan quota is used up, instead
  // of letting the user upload + submit only to get a 429 back.
  useEffect(() => {
    let alive = true;
    api
      .get<{ limited: boolean; scansUsed: number; scansLimit: number }>(
        "/me/usage",
      )
      .then((r) => {
        if (!alive) return;
        if (r.data.limited && r.data.scansUsed >= r.data.scansLimit) {
          setScanQuotaReached(true);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const [sourceLang, setSourceLang] = useState<TargetLanguage>("auto");

  const [targetLang, setTargetLang] = useState<TargetLanguage>(
    savedTargetLang as TargetLanguage,
  );

  useEffect(() => {
    updateGlobalTargetLang(targetLang);
  }, [targetLang]);

  // ---------- FILE HANDLING ----------
  // Presentation-only helper shared by inputs + drag/drop; same validation rules.
  const acceptFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError(t.scanErrNotImage);
      toast.error(t.scanErrNotImage);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t.scanErrTooLarge);
      toast.error(t.scanErrTooLarge);
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    acceptFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (loading) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------- SUBMIT ----------
  async function scanCreate(file: File) {
    const form = new FormData();
    form.append("image", file);

    const sourceToSend = LANGUAGE_MAP[sourceLang].engine2Supported
      ? sourceLang
      : "auto";

    form.append("rootLang", sourceToSend);
    form.append("targetLang", targetLang);
    form.append("topic", topic);
    updateGlobalTargetLang(targetLang);

    // Use axios so Bearer token is auto-attached by interceptor
    const res = await api.post<{ id: string }>(
      "/conversations/scan-create",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.id;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStage(0);
    setError(null);

    try {
      updateGlobalTargetLang(targetLang);

      const conversationId = await scanCreate(file);
      navigate(`/conversations/${conversationId}`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 429) {
        setScanQuotaReached(true);
        setError(t.scanQuotaError);
        toast.error(t.scanQuotaError);
      } else {
        setError(t.scanErrSubmit);
        toast.error(t.scanErrSubmit);
      }
      setLoading(false);
    }
  };

  return (
    <form className="scan-page" onSubmit={onSubmit}>
      {/* Hidden inputs: gallery + camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="scan-file-input"
        tabIndex={-1}
        aria-hidden="true"
        disabled={loading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="scan-file-input"
        tabIndex={-1}
        aria-hidden="true"
        disabled={loading}
      />

      {/* STEP 1: Upload Image */}
      <Card className="scan-card" padding="md">
        <h2 className="scan-section-title">{t.scanStep1}</h2>

        {!preview ? (
          <div
            className={`scan-dropzone${dragOver ? " is-dragover" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={t.scanUploadSelectAria}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!loading) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="scan-dropzone-icon" aria-hidden="true">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <p className="scan-dropzone-title">{t.scanUploadSelect}</p>
            <div className="scan-dropzone-actions">
              <Button
                variant="primary"
                size="sm"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                leftIcon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                }
              >
                {t.scanUploadCamera}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                leftIcon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                }
              >
                {t.scanUploadGallery}
              </Button>
            </div>
            <p className="scan-dropzone-hint">{t.scanUploadHint}</p>
          </div>
        ) : (
          <div className="scan-preview">
            {file && (
              <div className="scan-file-info">
                <span className="scan-file-name">{file.name}</span>
                <span className="scan-file-size">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}

            <div className="scan-preview-frame">
              <img src={preview} alt={t.scanPreviewAlt} />
              <button
                type="button"
                className="scan-preview-remove"
                onClick={handleRemoveFile}
                disabled={loading}
                aria-label={t.scanUploadSelectedAria}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="scan-preview-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                leftIcon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                }
              >
                {t.scanUploadSelect}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={loading}
                leftIcon={
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                }
              >
                {t.scanUploadCamera}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* STEP 2: Select Topic */}
      <Card className="scan-card" padding="md">
        <h2 className="scan-section-title">{t.scanStep2}</h2>
        <p className="scan-section-hint">{t.scanTopicDesc}</p>

        <div
          className="scan-topics"
          role="radiogroup"
          aria-label={t.scanStep2}
        >
          {TOPIC_OPTIONS.map((opt) => {
            const active = topic === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                className={`scan-topic-chip${active ? " is-active" : ""}`}
                onClick={() => setTopic(opt.value)}
                disabled={loading}
              >
                <span className="scan-topic-icon" aria-hidden="true">
                  {opt.icon}
                </span>
                <span>{t.topicLabels[opt.value]}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* STEP 3: Language Settings */}
      <Card className="scan-card" padding="md">
        <h2 className="scan-section-title">{t.scanStep3}</h2>

        <div className="scan-lang-grid">
          <div className="scan-lang-col">
            <Field label={t.scanSourceLang}>
              <Dropdown<TargetLanguage>
                value={sourceLang}
                onChange={(v) => !loading && setSourceLang(v)}
                ariaLabel={t.scanSourceLang}
                minWidth={260}
                searchable
                searchPlaceholder={t.dropdownSearchPlaceholder}
                noResultsLabel={t.dropdownNoResults}
                options={[
                  ...Object.entries(LANGUAGE_MAP)
                    .filter(([, lang]) => lang.engine2Supported)
                    .map(([code, lang]) => ({
                      value: code as TargetLanguage,
                      label: `${lang.flag} ${
                        code === "auto" ? t.scanLangAutoDetect : lang.label
                      }`,
                    })),
                  ...Object.entries(LANGUAGE_MAP)
                    .filter(([, lang]) => !lang.engine2Supported)
                    .map(([code, lang]) => ({
                      value: code as TargetLanguage,
                      label: `${lang.flag} ${
                        code === "auto" ? t.scanLangAutoDetect : lang.label
                      }`,
                    })),
                ]}
              />
            </Field>
          </div>

          {/* Animated "translate from → to" indicator */}
          <div className="scan-lang-arrow" aria-hidden="true">
            <span className="scan-lang-arrow__chevron">›</span>
            <span className="scan-lang-arrow__chevron">›</span>
            <span className="scan-lang-arrow__chevron">›</span>
          </div>

          <div className="scan-lang-col">
            <Field label={t.scanTargetLang}>
              <Dropdown<TargetLanguage>
                value={targetLang}
                onChange={(v) => !loading && setTargetLang(v)}
                ariaLabel={t.scanTargetLang}
                minWidth={260}
                searchable
                searchPlaceholder={t.dropdownSearchPlaceholder}
                noResultsLabel={t.dropdownNoResults}
                options={TRANSLATION_LANGS.map((l) => ({
                  value: l.code,
                  label: `${l.flag} ${l.label}`,
                }))}
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* Inline error (also surfaced via toast) */}
      {error && !loading && (
        <ErrorState
          message={error}
          onRetry={() => setError(null)}
          retryLabel={t.cancelBtn}
        />
      )}

      {/* Quota exhausted — block scanning + tell the user why */}
      {scanQuotaReached && (
        <div className="scan-quota-banner" role="alert">
          <span className="scan-quota-banner__icon" aria-hidden="true">
            ⚡
          </span>
          <span>{t.scanQuotaError}</span>
        </div>
      )}

      {/* SUBMIT */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={loading}
        disabled={!file || loading || scanQuotaReached}
      >
        {loading ? t.scanProcessing : t.scanSubmit}
      </Button>

      {/* Processing overlay — staged, reassuring status copy */}
      {loading &&
        (() => {
          const stageText =
            [t.scanStageUploading, t.scanStageReading, t.scanStageThinking][
              stage
            ] ?? t.scanProcessing;
          return (
            <div className="scan-overlay" role="status" aria-live="polite">
              <div className="scan-overlay-box">
                <Spinner size="lg" label={stageText} />
                <p className="scan-overlay-text">{stageText}</p>
              </div>
            </div>
          );
        })()}
    </form>
  );
}
