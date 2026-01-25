import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* Settings button - top right */}
      <button
        className="home__settings-btn"
        onClick={() => navigate("/settings")}
        aria-label="Open settings"
        title="Cài đặt"
      >
        ⚙️
      </button>

      {/* Hero section with glassmorphism background */}
      <div className="home__hero glass-bg">
        <div className="home__content">
          {/* Main heading with gradient accent */}
          <header className="home__header">
            <h1 className="home__title">
              <span className="gradient-text">Scan & Chat AI</span>
            </h1>
            <p className="home__subtitle">
              Quét tài liệu · OCR · Hỏi đáp thông minh với AI
            </p>
          </header>

          {/* Primary action area - Primary button should stand out */}
          <section className="home__actions" aria-label="Main navigation">
            <button
              className="btn btn--primary btn--large btn--full-mobile"
              onClick={() => navigate("/scan")}
              aria-label="Scan a travel document or image"
            >
              <span className="btn__icon">📷</span>
              <span className="btn__text">Scan tài liệu</span>
            </button>

            {/* Secondary action - less visual prominence */}
            <button
              className="btn btn--secondary btn--large btn--full-mobile"
              onClick={() => navigate("/history")}
              aria-label="View chat history"
            >
              <span className="btn__icon">💬</span>
              <span className="btn__text">Lịch sử chat</span>
            </button>
          </section>

          {/* Trust indicators - subtle, non-intrusive */}
          <footer className="home__footer">
            <div className="home__benefits">
              <span className="benefit">⚡ Nhanh</span>
              <span className="benefit">🎯 Chính xác</span>
              <span className="benefit">🔒 Riêng tư</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
