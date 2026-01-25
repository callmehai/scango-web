/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type { Conversation } from "../types/conversation";

export default function History() {
  const [list, setList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/conversations/history")
      .then((res) => {
        setList(res.data);
        setError(null);
      })
      .catch(() => {
        setList([]);
        setError("Không thể tải lịch sử chat");
      })
      .finally(() => setLoading(false));
  }, []);

  const deleteConversation = async (id: string) => {
    if (!window.confirm("Xóa cuộc trò chuyện này?")) return;

    try {
      await api.delete(`/conversations/${id}`);
      setList((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError("Không thể xóa cuộc trò chuyện");
    }
  };

  const renameConversation = async (id: string, oldTitle?: string) => {
    const title = prompt("Đổi tên cuộc trò chuyện:", oldTitle || "");
    if (!title?.trim()) return;

    try {
      await api.patch(`/conversations/${id}`, { title });
      setList((prev) => prev.map((c) => (c._id === id ? { ...c, title } : c)));
    } catch (err) {
      setError("Không thể đổi tên cuộc trò chuyện");
    }
  };

  return (
    <div className="history">
      {/* Header with navigation */}
      <header className="history__header">
        <h1 className="history__title">💬 Lịch sử chat</h1>
        <button
          className="history__back-btn"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          title="Quay về trang chủ"
        >
          ←
        </button>
      </header>

      {/* Error state */}
      {error && (
        <div className="history__error" role="alert">
          {error}
        </div>
      )}

      {/* Main content */}
      <main className="history__main">
        {/* Loading state */}
        {loading && (
          <div className="history__loading">
            <p>Đang tải lịch sử...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && list.length === 0 && !error && (
          <div className="history__empty">
            <p className="history__empty-icon">💭</p>
            <h2 className="history__empty-title">Chưa có cuộc trò chuyện</h2>
            <p className="history__empty-text">
              Bắt đầu bằng cách scan một tài liệu
            </p>
            <button
              className="history__cta-btn"
              onClick={() => navigate("/scan")}
            >
              📷 Scan tài liệu
            </button>
          </div>
        )}

        {/* Conversations list */}
        {!loading && list.length > 0 && (
          <div className="history__list" role="list">
            {list.map((c) => (
              <article key={c._id} className="history__item" role="listitem">
                {/* Item content - clickable area */}
                <button
                  className="history__item-main"
                  onClick={() => navigate(`/conversations/${c._id}`)}
                  aria-label={`Open conversation: ${c.title || "Untitled"}`}
                >
                  <div className="history__item-content">
                    <h3 className="history__item-title">
                      {c.title || "Untitled Conversation"}
                    </h3>
                    <time className="history__item-time">
                      {new Date(c.createdAt).toLocaleString("vi-VN")}
                    </time>
                  </div>
                  <div className="history__item-arrow">›</div>
                </button>

                {/* Item actions - rename, delete */}
                <div className="history__item-actions">
                  <button
                    className="history__action-btn"
                    onClick={() => renameConversation(c._id, c.title)}
                    aria-label="Rename conversation"
                    title="Đổi tên"
                  >
                    ✏️
                  </button>
                  <button
                    className="history__action-btn history__action-btn--danger"
                    onClick={() => deleteConversation(c._id)}
                    aria-label="Delete conversation"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
