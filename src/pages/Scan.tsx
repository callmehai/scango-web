import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import "../styles/Scan.css";

type TargetLanguage = "vi" | "en" | "ja" | "ko" | "zh" | "fr";
type DocumentTopic = "product" | "history" | "place" | "general";

export default function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get target language from settings
  const { targetLang: savedTargetLang } = useSettings();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState<TargetLanguage>(
    savedTargetLang as TargetLanguage,
  );
  const [topic, setTopic] = useState<DocumentTopic>(() => {
    // Try to restore last selected topic from localStorage
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

  // Persist topic selection to localStorage
  useEffect(() => {
    localStorage.setItem("lastSelectedTopic", topic);
  }, [topic]);

  // Handle file selection with preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("Vui lòng chọn một file hình ảnh");
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File quá lớn (tối đa 10MB)");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Vui lòng chọn file");
      return;
    }

    if (!targetLang) {
      setError("Vui lòng chọn ngôn ngữ");
      return;
    }

    if (!topic) {
      setError("Vui lòng chọn loại tài liệu");
      return;
    }

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("image", file);
    form.append("targetLang", targetLang);
    form.append("topic", topic);

    try {
      const res = await api.post("/conversations/scan", form);
      navigate(`/conversations/${res.data.conversationId}`);
    } catch (err) {
      setError("Lỗi khi xử lý hình ảnh. Vui lòng thử lại.");
      console.error("Scan error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scan">
      {/* Header with navigation */}
      <header className="scan__header">
        <h1 className="scan__title">📷 Scan tài liệu</h1>
        <button
          className="scan__back-btn"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          title="Quay về trang chủ"
        >
          ←
        </button>
      </header>

      {/* Main content */}
      <main className="scan__main">
        <form className="scan__form" onSubmit={onSubmit}>
          {/* Error message */}
          {error && (
            <div className="scan__error" role="alert">
              {error}
            </div>
          )}

          {/* File upload section */}
          <fieldset className="scan__fieldset">
            <legend className="scan__legend">Bước 1: Chọn ảnh</legend>

            <div className="scan__upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="scan__file-input"
                aria-label="Select image file"
                disabled={loading}
              />

              <button
                type="button"
                className="scan__upload-button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                aria-label={file ? "Change selected image" : "Select an image"}
              >
                <span className="scan__upload-icon">📁</span>
                <span className="scan__upload-text">
                  {file ? "✓ Đã chọn" : "Chọn ảnh"}
                </span>
              </button>

              {file && (
                <div className="scan__file-info">
                  <p className="scan__file-name">{file.name}</p>
                  <p className="scan__file-size">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              )}

              {preview && (
                <div className="scan__preview">
                  <img
                    src={preview}
                    alt="Preview of selected image"
                    className="scan__preview-image"
                  />
                </div>
              )}
            </div>
          </fieldset>

          {/* Topic selection section */}
          <fieldset className="scan__fieldset">
            <legend className="scan__legend">Bước 2: Chọn loại tài liệu</legend>

            <div className="scan__topic">
              <p className="scan__topic-description">
                Chọn loại tài liệu để AI hiểu rõ hơn nội dung của bạn
              </p>

              <div className="scan__topic-options">
                <label className="scan__topic-option">
                  <input
                    type="radio"
                    name="topic"
                    value="product"
                    checked={topic === "product"}
                    onChange={(e) => setTopic(e.target.value as DocumentTopic)}
                    disabled={loading}
                    className="scan__topic-input"
                  />
                  <span className="scan__topic-label">
                    <span className="scan__topic-icon">📦</span>
                    <span className="scan__topic-text">Thông tin sản phẩm</span>
                  </span>
                </label>

                <label className="scan__topic-option">
                  <input
                    type="radio"
                    name="topic"
                    value="history"
                    checked={topic === "history"}
                    onChange={(e) => setTopic(e.target.value as DocumentTopic)}
                    disabled={loading}
                    className="scan__topic-input"
                  />
                  <span className="scan__topic-label">
                    <span className="scan__topic-icon">📚</span>
                    <span className="scan__topic-text">Thông tin lịch sử</span>
                  </span>
                </label>

                <label className="scan__topic-option">
                  <input
                    type="radio"
                    name="topic"
                    value="place"
                    checked={topic === "place"}
                    onChange={(e) => setTopic(e.target.value as DocumentTopic)}
                    disabled={loading}
                    className="scan__topic-input"
                  />
                  <span className="scan__topic-label">
                    <span className="scan__topic-icon">📍</span>
                    <span className="scan__topic-text">Địa điểm / Du lịch</span>
                  </span>
                </label>

                <label className="scan__topic-option">
                  <input
                    type="radio"
                    name="topic"
                    value="general"
                    checked={topic === "general"}
                    onChange={(e) => setTopic(e.target.value as DocumentTopic)}
                    disabled={loading}
                    className="scan__topic-input"
                  />
                  <span className="scan__topic-label">
                    <span className="scan__topic-icon">📄</span>
                    <span className="scan__topic-text">Tài liệu chung</span>
                  </span>
                </label>
              </div>
            </div>
          </fieldset>

          {/* Language selection section */}
          <fieldset className="scan__fieldset">
            <legend className="scan__legend">Bước 3: Chọn ngôn ngữ</legend>

            <div className="scan__language">
              <label htmlFor="target-lang" className="scan__label">
                🌍 Dịch sang ngôn ngữ:
              </label>
              <select
                id="target-lang"
                value={targetLang}
                onChange={(e) =>
                  setTargetLang(e.target.value as TargetLanguage)
                }
                className="scan__select"
                disabled={loading}
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇺🇸 English</option>
                <option value="ja">🇯🇵 Japanese (日本語)</option>
                <option value="ko">🇰🇷 Korean (한국어)</option>
                <option value="zh">🇨🇳 Chinese (中文)</option>
                <option value="fr">🇫🇷 French (Français)</option>
              </select>
            </div>
          </fieldset>

          {/* Submit button */}
          <div className="scan__actions">
            <button
              type="submit"
              className="scan__submit-btn"
              disabled={!file || loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <span className="scan__spinner">⏳</span>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Scan & Chat</span>
                </>
              )}
            </button>
          </div>

          {/* Helper text */}
          {!file && (
            <p className="scan__helper">
              💡 Chọn ảnh tài liệu, hóa đơn, menu, hay bất kỳ tài liệu nào bạn
              muốn dịch hoặc hỏi
            </p>
          )}
        </form>
      </main>
    </div>
  );
}
