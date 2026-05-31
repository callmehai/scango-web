import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import type { Conversation } from "../types/conversation";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import { TOPIC_OPTIONS } from "../constants/scan";
import ActionMenu from "../components/ActionMenu";
import Dropdown from "../components/Dropdown";
import {
  Button,
  Card,
  Badge,
  Skeleton,
  EmptyState,
  ErrorState,
  Modal,
  ConfirmDialog,
  Field,
  Input,
  useToast,
} from "../components/ui";
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
    aria-hidden="true"
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
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const SearchIcon = () => (
  <svg
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
);

const GridIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const ListIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
);

const ConvIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h8M8 14h4" />
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
  const toast = useToast();

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
      setList((prev) => prev.filter((c) => c.id !== id));
      setTotal((n) => Math.max(0, n - 1));
      toast.success(t.historyDeleteSuccess);
    } catch {
      toast.error(t.historyDeleteError, { duration: 6000 });
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
          c.id === renameData.id ? { ...c, title: renameData.title } : c,
        ),
      );
      toast.success(t.historyRenameSuccess);
    } catch {
      toast.error(t.historyRenameError, { duration: 6000 });
    } finally {
      setRenameData(null);
    }
  };

  const topicLabels = t.topicLabels as Record<string, string>;

  const buildActions = (c: Conversation) => [
    {
      label: t.historyRename,
      icon: <RenameIcon />,
      onSelect: () => setRenameData({ id: c.id, title: c.title || "" }),
    },
    {
      label: t.historyDelete,
      danger: true,
      icon: <TrashIcon />,
      onSelect: () => setDeleteId(c.id),
    },
  ];

  const topicOption = (value: string) => {
    const opt = TOPIC_OPTIONS.find((o) => o.value === value);
    if (!opt) return null;
    return { icon: opt.icon, label: topicLabels[opt.value] ?? opt.value };
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(systemLang === "vi" ? "vi-VN" : "en-US");

  const isFiltering = Boolean(topic || qDebounced);
  const showSkeleton = loading && list.length === 0;
  const showEmpty = !loading && list.length === 0 && !error;
  const showError = !loading && Boolean(error) && list.length === 0;
  const showList = list.length > 0;

  return (
    <div className="history">
      {/* Toolbar: search + topic filter + grid/list toggle */}
      <div className="history__toolbar">
        <div className="history__search">
          <span className="history__search-icon" aria-hidden="true">
            <SearchIcon />
          </span>
          <Input
            type="search"
            inputSize="md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.historySearchPlaceholder}
            aria-label={t.historySearchPlaceholder}
            className="history__search-input"
          />
        </div>

        <div className="history__toolbar-right">
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

          <div
            className="history__view-toggle"
            role="group"
            aria-label={t.historyViewToggleLabel}
          >
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
              <GridIcon />
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
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      {/* SKELETON — initial load */}
      {showSkeleton && (
        <div
          className={`history__list ${
            viewMode === "grid" ? "history__list--grid" : "history__list--rows"
          }`}
          aria-busy="true"
        >
          {Array.from({ length: viewMode === "grid" ? 6 : 5 }).map((_, i) => (
            <Card key={i} padding="md" className="history__card">
              <div className="history__card-body">
                <Skeleton variant="circle" width={48} height={48} />
                <div className="history__card-text">
                  <Skeleton width="70%" height={18} radius="var(--radius-sm)" />
                  <Skeleton width="40%" height={13} radius="var(--radius-sm)" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ERROR — load failed, nothing to show */}
      {showError && (
        <ErrorState
          message={error}
          onRetry={fetchPage}
          retryLabel={t.commonRetry}
        />
      )}

      {/* EMPTY — no results */}
      {showEmpty &&
        (isFiltering ? (
          <EmptyState
            icon="🔍"
            title={t.historyNoResults}
            description={t.historyNoResultsDesc}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setTopic("");
                  setQ("");
                }}
              >
                {t.historyClearFilters}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon="💭"
            title={t.historyEmptyTitle}
            description={t.historyEmptyDesc}
            action={
              <Button onClick={() => navigate("/scan")}>{t.scanBtn}</Button>
            }
          />
        ))}

      {/* GRID MODE — responsive Card grid with topic thumbnail */}
      {showList && viewMode === "grid" && (
        <div
          className={`history__list history__list--grid ${
            loading ? "history__list--refreshing" : ""
          }`}
        >
          {list.map((c) => {
            const topicInfo = topicOption(c.topic);
            return (
              <Card
                key={c.id}
                padding="none"
                hoverable
                className="history__card"
              >
                <button
                  type="button"
                  className="history__card-open"
                  onClick={() => navigate(`/conversations/${c.id}`)}
                  aria-label={`${t.historyOpenConversation}: ${
                    c.title || t.historyUntitled
                  }`}
                >
                  <span className="history__thumb" aria-hidden="true">
                    {topicInfo ? (
                      <span className="history__thumb-emoji">
                        {topicInfo.icon}
                      </span>
                    ) : (
                      <ConvIcon />
                    )}
                  </span>
                  <span className="history__card-text">
                    <span className="history__card-title">
                      {c.title || t.historyUntitled}
                    </span>
                    <span className="history__card-meta">
                      {topicInfo && (
                        <Badge variant="primary" size="sm">
                          {topicInfo.label}
                        </Badge>
                      )}
                      <time className="history__card-time">
                        {formatDate(c.createdAt)}
                      </time>
                    </span>
                  </span>
                </button>
                <div className="history__card-actions">
                  <ActionMenu
                    ariaLabel={`${t.historyActionsFor}: ${
                      c.title || t.historyUntitled
                    }`}
                    items={buildActions(c)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* LIST MODE — compact rows with thumbnail */}
      {showList && viewMode === "list" && (
        <div
          className={`history__list history__list--rows ${
            loading ? "history__list--refreshing" : ""
          }`}
        >
          {list.map((c) => {
            const topicInfo = topicOption(c.topic);
            return (
              <Card
                key={c.id}
                padding="none"
                hoverable
                className="history__card history__card--row"
              >
                <button
                  type="button"
                  className="history__card-open history__card-open--row"
                  onClick={() => navigate(`/conversations/${c.id}`)}
                  aria-label={`${t.historyOpenConversation}: ${
                    c.title || t.historyUntitled
                  }`}
                >
                  <span className="history__thumb history__thumb--sm" aria-hidden="true">
                    {topicInfo ? (
                      <span className="history__thumb-emoji">
                        {topicInfo.icon}
                      </span>
                    ) : (
                      <ConvIcon />
                    )}
                  </span>
                  <span className="history__row-text">
                    <span className="history__card-title">
                      {c.title || t.historyUntitled}
                    </span>
                    <span className="history__row-meta">
                      {topicInfo && (
                        <Badge variant="neutral" size="sm">
                          {topicInfo.label}
                        </Badge>
                      )}
                      <time className="history__card-time">
                        {formatDate(c.createdAt)}
                      </time>
                    </span>
                  </span>
                </button>
                <div className="history__card-actions history__card-actions--row">
                  <ActionMenu
                    ariaLabel={`${t.historyActionsFor}: ${
                      c.title || t.historyUntitled
                    }`}
                    items={buildActions(c)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination — only when there is at least one page of data */}
      {showList && (
        <nav
          className="history__pagination"
          aria-label={t.historyPaginationLabel}
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
              aria-label={t.historyPaginationFirst}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="history__pagination-arrow"
              onClick={() => setPage(totalPages)}
              disabled={safePage >= totalPages || loading}
              aria-label={t.historyPaginationLast}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
      )}

      {/* Rename Modal */}
      <Modal
        open={Boolean(renameData)}
        onClose={() => setRenameData(null)}
        title={t.historyRenameTitle}
        closeLabel={t.commonClose}
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setRenameData(null)}>
              {t.cancelBtn}
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameData?.title.trim()}
            >
              {t.save}
            </Button>
          </>
        }
      >
        <Field label={t.historyRenameTitle}>
          {({ id }) => (
            <Input
              id={id}
              autoFocus
              value={renameData?.title ?? ""}
              onChange={(e) =>
                setRenameData((prev) =>
                  prev ? { ...prev, title: e.target.value } : prev,
                )
              }
              placeholder={t.historyRenamePlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          )}
        </Field>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => (deleteId ? handleDelete(deleteId) : undefined)}
        title={t.historyDeleteTitle}
        message={t.historyDeleteConfirm}
        confirmLabel={t.delete}
        cancelLabel={t.cancelBtn}
        closeLabel={t.commonClose}
        tone="danger"
      />
    </div>
  );
}
