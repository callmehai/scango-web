import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import type { TargetLanguage } from "../constants/languages";
import { LANGUAGE_MAP } from "../constants/languages";
import { TOPIC_OPTIONS, TRANSLATION_LANGS } from "../constants/scan";
import { UI_TEXT } from "../constants/uiText";
import "../styles/Scan.css";

type DocumentTopic = "product" | "history" | "place" | "general";

export default function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const {
    systemLang,
    targetLang: savedTargetLang,
    theme,
    toggleTheme,
    setTargetLang: updateGlobalTargetLang,
  } = useSettings();
  const t = UI_TEXT[systemLang];

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

  useEffect(() => {
    localStorage.setItem("lastSelectedTopic", topic);
  }, [topic]);

  const [sourceLang, setSourceLang] = useState<TargetLanguage>("auto");

  const [targetLang, setTargetLang] = useState<TargetLanguage>(
    savedTargetLang as TargetLanguage,
  );

  useEffect(() => {
    updateGlobalTargetLang(targetLang);
  }, [targetLang]);

  // ---------- FILE HANDLING ----------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError(t.scanErrNotImage);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError(t.scanErrTooLarge);
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

    const res = await fetch(
      `${api.defaults.baseURL}/conversations/scan-create`,
      {
        method: "POST",
        body: form,
      },
    );

    const data = await res.json();
    return data.conversationId;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      updateGlobalTargetLang(targetLang);

      const conversationId = await scanCreate(file);
      navigate(`/conversations/${conversationId}`);
    } catch {
      setError(t.scanErrSubmit);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scan">
      {/* Top actions */}
      <div className="scan__top-actions">
        <button
          className="scan__theme-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
        >
          {theme === "light" ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <button
          className="scan__back-btn"
          onClick={() => navigate("/")}
          aria-label={t.backHome}
          title={t.backHome}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Background decorative elements */}
      <div className="scan__background">
        <div className="gradient-orb gradient-orb--1"></div>
        <div className="gradient-orb gradient-orb--2"></div>
      </div>

      {/* Main container */}
      <div className="scan__container">
        {/* Header */}
        <header className="scan__header">
          <div className="scan__icon-wrapper">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <h1 className="scan__title">
            <span className="gradient-text">{t.scanTitle}</span>
          </h1>
          <p className="scan__subtitle">{t.scanHelp}</p>
        </header>

        {/* Form card */}
        <form className="scan__card" onSubmit={onSubmit}>
          {/* Error message */}
          {error && (
            <div className="scan__error" role="alert">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload Image */}
          <section className="scan__section">
            <h3 className="scan__section-title">{t.scanStep1}</h3>

            <div className="scan__upload">
              {/* Hidden file input for gallery */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="scan__file-input"
                disabled={loading}
              />

              {/* Hidden file input for camera */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="scan__file-input"
                disabled={loading}
              />

              {!preview ? (
                <div className="scan__upload-options">
                  <button
                    type="button"
                    className="scan__upload-button scan__upload-button--camera"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading}
                  >
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
                    <span>{t.scanUploadCamera}</span>
                  </button>

                  <button
                    type="button"
                    className="scan__upload-button scan__upload-button--gallery"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>{t.scanUploadGallery}</span>
                  </button>
                </div>
              ) : (
                <>
                  {file && (
                    <div className="scan__file-info">
                      <span>{file.name}</span>
                      <span>({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  )}

                  <div className="scan__preview">
                    <img
                      src={preview}
                      alt={t.scanPreviewAlt}
                      className="scan__preview-image"
                    />
                  </div>

                  <button
                    type="button"
                    className="scan__upload-button"
                    onClick={handleRemoveFile}
                    disabled={loading}
                    style={{ padding: "16px 24px" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>{t.scanUploadSelected}</span>
                  </button>
                </>
              )}
            </div>
          </section>

          {/* STEP 2: Select Topic */}
          <section className="scan__section">
            <h3 className="scan__section-title">{t.scanStep2}</h3>

            <div className="scan__topic-options">
              {TOPIC_OPTIONS.map((opt) => (
                <label key={opt.value} className="scan__topic-option">
                  <input
                    type="radio"
                    name="topic"
                    value={opt.value}
                    checked={topic === opt.value}
                    onChange={() => setTopic(opt.value)}
                    disabled={loading}
                    className="scan__topic-input"
                  />
                  <div className="scan__topic-card">
                    <span className="scan__topic-icon">{opt.icon}</span>
                    <span>{t.topicLabels[opt.value]}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* STEP 3: Language Settings */}
          <section className="scan__section">
            <h3 className="scan__section-title">{t.scanStep3}</h3>

            <div className="scan__language">
              <label>{t.scanSourceLang}</label>
              <select
                value={sourceLang}
                onChange={(e) =>
                  setSourceLang(e.target.value as TargetLanguage)
                }
                className="scan__select"
                disabled={loading}
              >
                <optgroup label={t.scanGroupBest}>
                  {Object.entries(LANGUAGE_MAP)
                    .filter(([, lang]) => lang.engine2Supported)
                    .map(([code, lang]) => (
                      <option key={code} value={code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                </optgroup>

                <optgroup label={t.scanGroupOther}>
                  {Object.entries(LANGUAGE_MAP)
                    .filter(([, lang]) => !lang.engine2Supported)
                    .map(([code, lang]) => (
                      <option key={code} value={code}>
                        {lang.flag} {lang.label}
                      </option>
                    ))}
                </optgroup>
              </select>

              <label>{t.scanTargetLang}</label>
              <select
                value={targetLang}
                onChange={(e) =>
                  setTargetLang(e.target.value as TargetLanguage)
                }
                className="scan__select"
                disabled={loading}
              >
                {TRANSLATION_LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* SUBMIT BUTTON */}
          <div className="scan__actions">
            <button
              type="submit"
              className="scan__submit-btn"
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>{t.scanProcessing}</span>
                </>
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  <span>{t.scanSubmit}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
