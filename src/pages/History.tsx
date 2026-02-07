/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type { Conversation } from "../types/conversation";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import "../styles/History.css";

export default function History() {
  const [list, setList] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameData, setRenameData] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const navigate = useNavigate();
  const { systemLang, theme, toggleTheme } = useSettings();
  const t = UI_TEXT[systemLang];

  useEffect(() => {
    api
      .get("/conversations/history")
      .then((res) => {
        setList(res.data);
        setError(null);
      })
      .catch(() => {
        setList([]);
        setError(t.historyLoadError);
      })
      .finally(() => setLoading(false));
  }, [t]);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/conversations/${id}`);
      setList((prev) => prev.filter((c) => c._id !== id));
    } catch {
      setError(t.historyDeleteError);
    } finally {
      setDeleteId(null);
    }
  };

  const handleRename = async () => {
    if (!renameData || !renameData.title.trim()) return;

    try {
      await api.patch(`/conversations/${renameData.id}`, {
        title: renameData.title,
      });
      setList((prev) =>
        prev.map((c) =>
          c._id === renameData.id ? { ...c, title: renameData.title } : c,
        ),
      );
    } catch {
      setError(t.historyRenameError);
    } finally {
      setRenameData(null);
    }
  };

  return (
    <div className="history">
      {/* Top actions - Theme toggle & Back */}
      <div className="history__top-actions">
        <button
          className="history__theme-btn"
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
          className="history__back-btn"
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
      <div className="history__background">
        <div className="gradient-orb gradient-orb--1"></div>
        <div className="gradient-orb gradient-orb--2"></div>
      </div>

      {/* Main container */}
      <div className="history__container">
        {/* Header */}
        <header className="history__header">
          <div className="history__icon-wrapper">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="history__title">
            <span className="gradient-text">{t.historyTitle}</span>
          </h1>
          <p className="history__subtitle">
            {list.length > 0
              ? `${list.length} ${t.historyConversations || "conversations"}`
              : t.historyEmptyTitle}
          </p>
        </header>

        {/* Error message */}
        {error && (
          <div className="history__error" role="alert">
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

        {/* Loading state */}
        {loading && (
          <div className="history__loading">
            <div className="loading-spinner"></div>
            <p>{t.historyLoading}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && list.length === 0 && !error && (
          <div className="history__empty">
            <div className="history__empty-icon">💭</div>
            <h2 className="history__empty-title">{t.historyEmptyTitle}</h2>
            <p className="history__empty-text">{t.historyEmptyDesc}</p>
            <button
              className="history__cta-btn"
              onClick={() => navigate("/scan")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{t.scanBtn}</span>
            </button>
          </div>
        )}

        {/* Conversations list */}
        {!loading && list.length > 0 && (
          <div className="history__list">
            {list.map((c) => (
              <div key={c._id} className="conversation-card">
                <button
                  className="conversation-card__main"
                  onClick={() => navigate(`/conversations/${c._id}`)}
                  aria-label={`${t.historyOpenConversation}: ${c.title || t.historyUntitled}`}
                >
                  <div className="conversation-card__icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M8 10h8M8 14h4" />
                    </svg>
                  </div>

                  <div className="conversation-card__content">
                    <h3 className="conversation-card__title">
                      {c.title || t.historyUntitled}
                    </h3>
                    <time className="conversation-card__time">
                      {new Date(c.createdAt).toLocaleString(
                        systemLang === "vi" ? "vi-VN" : "en-US",
                      )}
                    </time>
                  </div>

                  <div className="conversation-card__arrow">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <div className="conversation-card__actions">
                  <button
                    className="conversation-card__action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameData({ id: c._id, title: c.title || "" });
                    }}
                    title={t.historyRename}
                    aria-label={t.historyRename}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    className="conversation-card__action-btn conversation-card__action-btn--danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(c._id);
                    }}
                    title={t.historyDelete}
                    aria-label={t.historyDelete}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renameData && (
        <div className="modal-overlay" onClick={() => setRenameData(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                {t.historyRenameTitle}
              </h3>
            </div>

            <input
              className="modal-input"
              value={renameData.title}
              onChange={(e) =>
                setRenameData({ ...renameData, title: e.target.value })
              }
              placeholder={t.historyRenamePlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenameData(null);
              }}
            />

            <div className="modal-actions">
              <button
                className="modal-btn modal-btn--cancel"
                onClick={() => setRenameData(null)}
              >
                {t.cancelBtn}
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={handleRename}
                disabled={!renameData.title.trim()}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title modal-title--danger">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {t.historyDeleteTitle}
              </h3>
            </div>

            <p className="modal-text">{t.historyDeleteConfirm}</p>

            <div className="modal-actions">
              <button
                className="modal-btn modal-btn--cancel"
                onClick={() => setDeleteId(null)}
              >
                {t.cancelBtn}
              </button>
              <button
                className="modal-btn modal-btn--danger"
                onClick={() => handleDelete(deleteId)}
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
