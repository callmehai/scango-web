import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type { Conversation } from "../types/conversation";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import { TOPIC_OPTIONS } from "../constants/scan";
import ActionMenu from "../components/ActionMenu";
import Dropdown from "../components/Dropdown";
import "../styles/History.css";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20] as const;
const DEFAULT_PAGE_SIZE = 20;

type ViewMode = "grid" | "list";
const VIEW_MODE_KEY = "history.viewMode";

/** Sliding window of up to 5 page numbers centered around `current`. */
function computePageNumbers(current: number, totalPages: number): number[] {
  const maxVisible = 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

const RenameIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function History() {
  const [list, setList] = useState<Conversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameData, setRenameData] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [topic, setTopic] = useState<string>("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      return stored === "list" ? "list" : "grid";
    } catch {
      return "grid";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  useEffect(() => {
    const id = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [topic, qDebounced, pageSize]);

  const reqIdRef = useRef(0);
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });

  const fetchPage = useCallback(async () => {
    const myReqId = ++reqIdRef.current;
    setLoading(true);
    try {
      const res = await api.get("/conversations/history", {
        params: {
          limit: pageSize,
          skip: (page - 1) * pageSize,
          ...(topic ? { topic } : {}),
          ...(qDebounced ? { q: qDebounced } : {}),
        },
      });
      if (myReqId !== reqIdRef.current) return;

      const { items, total } = res.data as {
        items: Conversation[];
        total: number;
      };
      setList(items);
      setTotal(total);
      setError(null);
    } catch {
      if (myReqId !== reqIdRef.current) return;
      setList([]);
      setError(tRef.current.historyLoadError);
    } finally {
      if (myReqId === reqIdRef.current) setLoading(false);
    }
  }, [topic, qDebounced, page, pageSize]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/conversations/${id}`);
      setList((prev) => prev.filter((c) => c._id !== id));
      setTotal((n) => Math.max(0, n - 1));
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

  const topicLabels = t.topicLabels as Record<string, string>;

  const buildActions = (c: Conversation) => [
    {
      label: t.historyRename,
      icon: <RenameIcon />,
      onSelect: () => setRenameData({ id: c._id, title: c.title || "" }),
    },
    {
      label: t.historyDelete,
      danger: true,
      icon: <TrashIcon />,
      onSelect: () => setDeleteId(c._id),
    },
  ];

  const topicOption = (value: string) => {
    const opt = TOPIC_OPTIONS.find((o) => o.value === value);
    if (!opt) return null;
    return { icon: opt.icon, label: topicLabels[opt.value] ?? opt.value };
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(systemLang === "vi" ? "vi-VN" : "en-US");

  return (
    <div className="history">
      <div className="history__background">
        <div className="gradient-orb gradient-orb--1"></div>
        <div className="gradient-orb gradient-orb--2"></div>
      </div>

      <div className="history__container">
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
          {total === 0 && !loading && (
            <p className="history__subtitle">{t.historyEmptyTitle}</p>
          )}
        </header>

        {/* Filter bar — search left, topic + view toggle right (all in one row) */}
        <div className="history__filters">
          <div className="history__search-wrapper">
            <svg
              className="history__search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="history__search-input"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t.historySearchPlaceholder}
              aria-label={t.historySearchPlaceholder}
            />
          </div>

          <Dropdown<string>
            value={topic}
            onChange={setTopic}
            ariaLabel={t.historyFilterAllTopics}
            minWidth={180}
            options={[
              { value: "", label: `🗂 ${t.historyFilterAllTopics}` },
              ...TOPIC_OPTIONS.map((opt) => ({
                value: opt.value as string,
                label: `${opt.icon} ${topicLabels[opt.value] ?? opt.value}`,
              })),
            ]}
          />

          <div className="history__view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`history__view-btn ${
                viewMode === "grid" ? "history__view-btn--active" : ""
              }`}
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              aria-label={t.historyViewGrid}
              title={t.historyViewGrid}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </button>
            <button
              type="button"
              className={`history__view-btn ${
                viewMode === "list" ? "history__view-btn--active" : ""
              }`}
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label={t.historyViewList}
              title={t.historyViewList}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <circle cx="4" cy="6" r="1" />
                <circle cx="4" cy="12" r="1" />
                <circle cx="4" cy="18" r="1" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="history__error" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading && list.length === 0 && (
          <div className="history__loading">
            <div className="loading-spinner"></div>
            <p>{t.historyLoading}</p>
          </div>
        )}

        {!loading && list.length === 0 && !error && (
          <div className="history__empty">
            {topic || qDebounced ? (
              <>
                <div className="history__empty-icon">🔍</div>
                <h2 className="history__empty-title">{t.historyNoResults}</h2>
              </>
            ) : (
              <>
                <div className="history__empty-icon">💭</div>
                <h2 className="history__empty-title">{t.historyEmptyTitle}</h2>
                <p className="history__empty-text">{t.historyEmptyDesc}</p>
                <button
                  className="history__cta-btn"
                  onClick={() => navigate("/scan")}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>{t.scanBtn}</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* GRID MODE — 3-column cards on desktop, 1 on mobile */}
        {list.length > 0 && viewMode === "grid" && (
          <div
            className={`history__list history__list--grid ${
              loading ? "history__list--refreshing" : ""
            }`}
          >
            {list.map((c) => (
              <div key={c._id} className="conversation-card">
                <button
                  className="conversation-card__main"
                  onClick={() => navigate(`/conversations/${c._id}`)}
                  aria-label={`${t.historyOpenConversation}: ${c.title || t.historyUntitled}`}
                >
                  <div className="conversation-card__icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      <path d="M8 10h8M8 14h4" />
                    </svg>
                  </div>
                  <div className="conversation-card__content">
                    <h3 className="conversation-card__title">
                      {c.title || t.historyUntitled}
                    </h3>
                    <time className="conversation-card__time">
                      {formatDate(c.createdAt)}
                    </time>
                  </div>
                </button>
                <div className="conversation-card__actions">
                  <ActionMenu
                    ariaLabel={`Actions for ${c.title || t.historyUntitled}`}
                    items={buildActions(c)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LIST MODE — table-like rows with columns */}
        {list.length > 0 && viewMode === "list" && (
          <div
            className={`history__table-wrapper ${
              loading ? "history__list--refreshing" : ""
            }`}
          >
            <table className="history__table">
              <thead>
                <tr>
                  <th>{t.historyColName}</th>
                  <th className="history__table-col-topic">{t.historyColTopic}</th>
                  <th className="history__table-col-date">{t.historyColCreated}</th>
                  <th className="history__table-col-actions" aria-label={t.historyColActions} />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const topicInfo = topicOption(c.topic);
                  return (
                    <tr
                      key={c._id}
                      className="history__row"
                      onClick={() => navigate(`/conversations/${c._id}`)}
                    >
                      <td className="history__cell-name">
                        <span className="history__row-title">
                          {c.title || t.historyUntitled}
                        </span>
                      </td>
                      <td className="history__cell-topic">
                        {topicInfo && (
                          <span className="history__topic-badge">
                            <span>{topicInfo.icon}</span>
                            <span>{topicInfo.label}</span>
                          </span>
                        )}
                      </td>
                      <td className="history__cell-date">
                        {formatDate(c.createdAt)}
                      </td>
                      <td
                        className="history__cell-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ActionMenu
                          ariaLabel={`Actions for ${c.title || t.historyUntitled}`}
                          items={buildActions(c)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination — always visible. 3-column layout:
            [Showing X-Y of Z]   [« ‹ 1 2 3 › »]   [Per page ▼] */}
        <nav
          className="history__pagination"
          aria-label="Pagination"
          role="navigation"
        >
          <div className="history__pagination-summary">
            {total > 0 &&
              t.historyShowingRange(
                (safePage - 1) * pageSize + 1,
                Math.min(safePage * pageSize, total),
                total,
              )}
          </div>

          <div className="history__pagination-controls">
            <button
              type="button"
              className="history__pagination-arrow"
              onClick={() => setPage(1)}
              disabled={safePage <= 1 || loading}
              aria-label="First page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
              </svg>
            </button>
            <button
              type="button"
              className="history__pagination-arrow"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1 || loading}
              aria-label={t.historyPaginationPrev}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {computePageNumbers(safePage, totalPages).map((n) => (
              <button
                key={n}
                type="button"
                className={`history__pagination-page ${
                  n === safePage ? "history__pagination-page--active" : ""
                }`}
                onClick={() => setPage(n)}
                disabled={loading}
                aria-current={n === safePage ? "page" : undefined}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              className="history__pagination-arrow"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages || loading}
              aria-label={t.historyPaginationNext}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="history__pagination-arrow"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages || loading}
              aria-label="Last page"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
              </svg>
            </button>
          </div>

          <div className="history__pagination-size">
            <span>{t.historyPerPage}</span>
            <Dropdown<number>
              value={pageSize}
              onChange={setPageSize}
              ariaLabel={t.historyPerPage}
              minWidth={84}
              options={PAGE_SIZE_OPTIONS.map((n) => ({
                value: n,
                label: String(n),
              }))}
            />
          </div>
        </nav>
      </div>

      {/* Rename Modal */}
      {renameData && (
        <div className="modal-overlay" onClick={() => setRenameData(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <RenameIcon />
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
                <TrashIcon />
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
