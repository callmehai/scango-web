import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useSettings, type Language } from "../hooks/useSettings";
import "../styles/Settings.css";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { targetLang, setTargetLang } = useSettings();

  return (
    <div className="settings">
      {/* Header */}
      <header className="settings__header">
        <h1 className="settings__title">⚙️ Cài đặt</h1>
        <button
          className="settings__back-btn"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          title="Quay về trang chủ"
        >
          ←
        </button>
      </header>

      {/* Main content */}
      <main className="settings__main">
        {/* Appearance section */}
        <section className="settings__section">
          <h2 className="settings__section-title">🎨 Giao diện</h2>
          <div className="settings__card">
            <div className="settings__item">
              <div className="settings__item-label">
                <label htmlFor="theme-toggle" className="settings__label">
                  Chế độ sáng/tối
                </label>
                <p className="settings__description">
                  Chọn giao diện phù hợp với điều kiện chiếu sáng của bạn
                </p>
              </div>

              <div className="settings__item-control">
                <select
                  id="theme-toggle"
                  className="settings__select"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as "light" | "dark")}
                >
                  <option value="light">☀️ Sáng</option>
                  <option value="dark">🌙 Tối</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Language section */}
        <section className="settings__section">
          <h2 className="settings__section-title">🌍 Ngôn ngữ</h2>
          <div className="settings__card">
            <div className="settings__item">
              <div className="settings__item-label">
                <label htmlFor="target-lang" className="settings__label">
                  Ngôn ngữ dịch mặc định
                </label>
                <p className="settings__description">
                  Ngôn ngữ sẽ được sử dụng khi dịch tài liệu quét
                </p>
              </div>

              <div className="settings__item-control">
                <select
                  id="target-lang"
                  className="settings__select"
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as Language)}
                >
                  <option value="vi">🇻🇳 Tiếng Việt</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="ja">🇯🇵 日本語 (Japanese)</option>
                  <option value="ko">🇰🇷 한국어 (Korean)</option>
                  <option value="zh">🇨🇳 中文 (Chinese)</option>
                  <option value="fr">🇫🇷 Français (French)</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Info section */}
        <section className="settings__section">
          <h2 className="settings__section-title">ℹ️ Thông tin</h2>
          <div className="settings__card">
            <div className="settings__info">
              <p className="settings__info-text">
                <strong>Scan & Chat AI v1.0</strong>
              </p>
              <p className="settings__info-text">
                Ứng dụng trợ lý AI dành cho du khách
              </p>
              <p className="settings__info-text settings__info-muted">
                Quét tài liệu, dịch, và chat với AI
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
