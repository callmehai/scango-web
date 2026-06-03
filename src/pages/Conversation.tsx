import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import api, { tokenStore } from "../api/axios";
import type { Message } from "../types/message";
import { UI_TEXT } from "../constants/uiText";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import {
  Button,
  Textarea,
  Modal,
  Field,
  Input,
  ConfirmDialog,
  Spinner,
  EmptyState,
  useToast,
} from "../components/ui";
import "../styles/Conversation.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// Keep in sync with backend AskRequest: [StringLength(4000, MinimumLength = 1)]
const MAX_QUESTION_CHARS = 4000;

async function consumeSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
  onText: (text: string) => Promise<void> | void,
) {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal.aborted) return;

    const { value, done } = await reader.read();
    if (done) return;

    buffer += decoder.decode(value, { stream: true });

    let sepIdx: number;
    while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
      const eventBlock = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);

      for (const line of eventBlock.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") return;

        try {
          const text = JSON.parse(data) as string;
          if (signal.aborted) return;
          await onText(text);
        } catch {
          // tolerate malformed event, keep streaming
        }
      }
    }
  }
}

export default function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { systemLang } = useSettings();
  const { user } = useAuth();
  const t = UI_TEXT[systemLang];
  const toast = useToast();

  // Initial for the user avatar (first letter of name, else email).
  const userInitial = (user?.name || user?.email || "?").trim()[0]?.toUpperCase() ?? "?";

  const [messages, setMessages] = useState<Message[]>([]);
  const [hasImage, setHasImage] = useState(false);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>(t.convDefaultTitle);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaReached, setQuotaReached] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [renameData, setRenameData] = useState<{ title: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  // Clamp pasted/typed input to the backend limit.
  const setInputClamped = (val: string) =>
    setInput(val.slice(0, MAX_QUESTION_CHARS));

  const charCountLabel = t.convCharCount
    .replace("{count}", String(input.length))
    .replace("{max}", String(MAX_QUESTION_CHARS));
  const charLimitReached = input.length >= MAX_QUESTION_CHARS;

  // Cleanup on unmount — abort any in-flight stream
  useEffect(() => {
    return () => {
      stopRef.current = true;
      abortRef.current?.abort();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Close the action menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  // Append SSE chunk straight to the assistant message. No fake typing — the
  // network already delivers tokens at a natural pace; re-buffering through a
  // worker introduced visible "stop/start" jitter.
  // Buffer incoming SSE chunks and flush them to React state once per animation
  // frame. Committing on every tiny token caused many renders per frame → the
  // "jerky" feel. Coalescing to ~60fps makes the stream smooth.
  const pendingTextRef = useRef("");
  const rafRef = useRef<number | null>(null);

  const flushPending = () => {
    rafRef.current = null;
    const chunk = pendingTextRef.current;
    if (!chunk) return;
    pendingTextRef.current = "";
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
    });
  };

  const appendAssistantText = (text: string) => {
    pendingTextRef.current += text;
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(flushPending);
    }
  };

  const startScanStream = async () => {
    stopRef.current = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, assistantMsg]);

    try {
      const accessToken = tokenStore.getAccess();
      const res = await fetch(
        `${api.defaults.baseURL}/conversations/${id}/scan-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
          signal: controller.signal,
        },
      );

      if (res.status === 429) {
        setQuotaReached(true);
        setError(t.convQuotaError);
        setMessages((m) => m.slice(0, -1));
        return;
      }
      if (!res.ok || !res.body) throw new Error("Network error");

      await consumeSseStream(
        res.body.getReader(),
        controller.signal,
        appendAssistantText,
      );
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        setError(t.convStreamError);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
      setTimeout(() => {
        api.get(`/conversations/${id}`).then((res) => {
          setTitle(res.data.title || t.convDefaultTitle);
        });
      }, 500);
    }
  };

  useEffect(() => {
    if (!id) return;

    setInitialLoading(true);
    api
      .get(`/conversations/${id}`)
      .then((res) => {
        const msgs = (res.data.messages ?? []) as Message[];

        setMessages(msgs);
        setHasImage(Boolean(res.data.hasImage));
        setTitle(res.data.title || t.convDefaultTitle);

        // Fetch image via auth'd request → blob URL so <img> tag can use it
        if (res.data.hasImage) {
          api
            .get(`/conversations/${id}/image`, { responseType: "blob" })
            .then((imgRes) => {
              const url = URL.createObjectURL(imgRes.data as Blob);
              setImageBlobUrl(url);
            })
            .catch(() => {
              /* image missing — skip */
            });
        }

        const hasAssistantInDB = msgs.some((m) => m.role === "assistant");
        if (res.data.hasImage && !hasAssistantInDB) {
          startScanStream();
        }
      })
      .catch(() => {
        setError(t.convStreamError);
      })
      .finally(() => {
        setInitialLoading(false);
      });

    // cleanup blob URL on unmount / id change
    return () => {
      setImageBlobUrl((url) => {
        if (url) URL.revokeObjectURL(url);
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Proactively reflect ask-quota exhaustion: disable the composer + show the
  // banner before the user even tries. The 429 handler in sendStream is the
  // safety net for the moment they hit the limit mid-session.
  useEffect(() => {
    let alive = true;
    api
      .get<{ limited: boolean; asksUsed: number; asksLimit: number }>(
        "/me/usage",
      )
      .then((r) => {
        if (!alive) return;
        const u = r.data;
        if (u.limited && u.asksUsed >= u.asksLimit) {
          setQuotaReached(true);
          setError(t.convQuotaError);
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, t.convQuotaError]);

  const sendStream = async () => {
    if (!input.trim() || loading) return;

    stopRef.current = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setQuotaReached(false);

    const userMsg: Message = {
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    };

    const assistantMsg: Message = {
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
    inputRef.current?.focus();

    try {
      const accessToken = tokenStore.getAccess();
      const res = await fetch(
        `${api.defaults.baseURL}/conversations/${id}/ask-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
          body: JSON.stringify({ question: userMsg.content }),
          signal: controller.signal,
        },
      );

      if (res.status === 429) {
        setQuotaReached(true);
        setError(t.convQuotaError);
        // drop the empty assistant placeholder bubble
        setMessages((m) => m.slice(0, -1));
        return;
      }
      if (!res.ok || !res.body) throw new Error("Network error");

      await consumeSseStream(
        res.body.getReader(),
        controller.signal,
        appendAssistantText,
      );
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError(t.convSendError);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: t.convSendErrorBubble,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  };

  const handleStop = () => {
    stopRef.current = true;
    abortRef.current?.abort();
    // flush any buffered text so the partial answer isn't lost
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      flushPending();
    }
    setLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendStream();
    }
  };

  // Auto-scroll to the bottom as new content streams in — but ONLY while the
  // user is following along at the bottom. The moment they scroll up to read,
  // we stop forcing scroll so they can move freely; we resume only after they
  // scroll back down to the bottom themselves.
  const stickToBottomRef = useRef(true);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      // Ignore the scroll events we trigger ourselves.
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      const distanceFromBottom =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      // User is "following" only if essentially pinned to the bottom.
      stickToBottomRef.current = distanceFromBottom <= 80;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    programmaticScrollRef.current = true;
    // jump instantly during streaming (no animation pile-up); smooth otherwise
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: loading ? "auto" : "smooth",
    });
  }, [messages, loading]);

  const visibleMessages = messages.filter((m) => m.role !== "system");

  const handleRename = async () => {
    if (!renameData || !renameData.title.trim()) return;

    try {
      await api.patch(`/conversations/${id}`, {
        title: renameData.title,
      });
      setTitle(renameData.title);
      setRenameData(null);
      toast.success(t.convRenameSuccess);
    } catch {
      toast.error(t.convRenameError);
    }
  };

  const handleDelete = async () => {
    // Throws on failure so ConfirmDialog keeps its loading/locked state and
    // the dialog isn't dismissed; toast surfaces the error.
    await api.delete(`/conversations/${id}`);
    toast.success(t.convDeleteSuccess);
    navigate("/history");
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(systemLang === "vi" ? "vi-VN" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // The OCR/scan prompt makes Gemini emit a leading "TITLE: ..." line (used to
  // name the conversation) before the body. Strip it so it never shows in the
  // chat bubble — the title already lives in the top bar.
  const stripTitleLine = (text: string) =>
    text.replace(/^\s*TITLE:.*(?:\r?\n)+/i, "");

  // Gemini emits LaTeX with \( \) / \[ \] delimiters as often as $ / $$, but
  // remark-math only understands the dollar form. Normalize the backslash
  // delimiters to dollars so formulas render, while leaving fenced/inline code
  // untouched (those segments sit at the odd indices of the split).
  const normalizeMath = (text: string): string =>
    text
      .split(/(```[\s\S]*?```|`[^`]*`)/g)
      .map((seg, i) =>
        i % 2 === 1
          ? seg
          : seg
              .replace(/\\\[([\s\S]+?)\\\]/g, (_m, body) => `$$${body}$$`)
              .replace(/\\\(([\s\S]+?)\\\)/g, (_m, body) => `$${body}$`),
      )
      .join("");

  // Whether the last assistant message is the one currently being streamed.
  const lastIndex = visibleMessages.length - 1;
  const isThreadEmpty =
    !initialLoading && visibleMessages.length === 0 && !hasImage && !loading;

  return (
    <div className="conversation-page">
      {/* In-page top bar: dynamic conversation title + action menu */}
      <div className="conversation-topbar">
        <h2 className="conversation-title" title={title}>
          {title}
        </h2>
        <div className="conversation-actions" ref={menuRef}>
          <button
            type="button"
            className="conversation-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t.convActionRename}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div className="conversation-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="conversation-menu__item"
                onClick={() => {
                  setRenameData({ title });
                  setMenuOpen(false);
                }}
              >
                {t.convActionRename}
              </button>
              <button
                type="button"
                role="menuitem"
                className="conversation-menu__item conversation-menu__item--danger"
                onClick={() => {
                  setShowDelete(true);
                  setMenuOpen(false);
                }}
              >
                {t.convActionDelete}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="conversation-messages"
        role="log"
        aria-label={t.convInputAria}
        aria-live="polite"
      >
        {initialLoading ? (
          <div className="conversation-center">
            <Spinner size="lg" label={t.historyLoading} />
          </div>
        ) : isThreadEmpty ? (
          <div className="conversation-center">
            <EmptyState
              icon="💬"
              title={t.convEmptyTitle}
              description={t.convEmptyText}
            />
          </div>
        ) : (
          <div className="conversation-thread">
            {hasImage && imageBlobUrl && (
              <div className="conversation-row conversation-row--assistant">
                <div className="conversation-bubble conversation-bubble--image">
                  <button
                    type="button"
                    className="conversation-image-btn"
                    onClick={() => setPreviewImage(imageBlobUrl)}
                    aria-label={t.convImagePreviewAlt}
                  >
                    <img
                      src={imageBlobUrl}
                      alt={t.convImageAlt}
                      className="conversation-bubble__image"
                      loading="lazy"
                    />
                  </button>
                </div>
              </div>
            )}

            {visibleMessages.map((m, idx) => {
              const isLast = idx === lastIndex;
              const isStreamingBubble =
                loading && isLast && m.role === "assistant";
              const isTypingBubble = isStreamingBubble && m.content === "";

              return (
                <div
                  key={idx}
                  className={`conversation-row conversation-row--${m.role}`}
                >
                  <div className="conversation-line">
                    <div
                      className={`conversation-avatar conversation-avatar--${m.role}`}
                      aria-hidden="true"
                    >
                      {m.role === "assistant" ? (
                        <img
                          src="/assets/ScanGoLogo.png"
                          alt=""
                          className="conversation-avatar__logo"
                        />
                      ) : (
                        userInitial
                      )}
                    </div>

                    <div
                      className={`conversation-bubble conversation-bubble--${m.role}${
                        isStreamingBubble && m.content !== ""
                          ? " conversation-bubble--streaming"
                          : ""
                      }`}
                    >
                      {isTypingBubble ? (
                        <div
                          className="conversation-typing"
                          role="status"
                          aria-label={t.convInputAria}
                        >
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : m.role === "assistant" ? (
                        <div className="conversation-bubble__md">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[
                              [rehypeKatex, { throwOnError: false }],
                            ]}
                          >
                            {normalizeMath(stripTitleLine(m.content))}
                          </ReactMarkdown>
                          {isStreamingBubble && m.content !== "" && (
                            <span
                              className="conversation-caret"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="conversation-bubble__text">
                          {m.content}
                        </div>
                      )}
                    </div>
                  </div>
                  {m.createdAt && !isTypingBubble && (
                    <div className="conversation-row__time">
                      {formatTime(m.createdAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* Composer (sticky) */}
      <div className="conversation-composer">
        {error && (
          <div
            className={`conversation-banner${
              quotaReached
                ? " conversation-banner--quota"
                : " conversation-banner--error"
            }`}
            role="alert"
          >
            <span className="conversation-banner__icon" aria-hidden="true">
              {quotaReached ? "⚡" : "⚠️"}
            </span>
            <span className="conversation-banner__text">{error}</span>
          </div>
        )}

        <div className="conversation-input-row">
          <Textarea
            ref={inputRef}
            className="conversation-textarea"
            value={input}
            onChange={(e) => setInputClamped(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.convInputPlaceholder}
            aria-label={t.convInputAria}
            maxLength={MAX_QUESTION_CHARS}
            rows={2}
            disabled={loading}
          />
          {/* Expand + send grouped in one bottom-right cluster, same size.
              Send is a bare ↑ arrow (no "Gửi" text — universally understood). */}
          <div className="conversation-input-actions">
            <button
              type="button"
              className="conversation-icon-btn conversation-expand-btn"
              onClick={() => setComposeOpen(true)}
              aria-label={t.convExpandAria}
              title={t.convExpandAria}
              disabled={loading}
            >
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
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
            {loading ? (
              <button
                type="button"
                className="conversation-icon-btn conversation-send-btn conversation-send-btn--stop"
                onClick={handleStop}
                aria-label={t.convStopAria}
                title={t.convStopAria}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="conversation-icon-btn conversation-send-btn"
                onClick={sendStream}
                disabled={!input.trim() || quotaReached}
                aria-label={t.convSendAria}
                title={t.convSendAria}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div
          className={`conversation-charcount${
            charLimitReached ? " conversation-charcount--max" : ""
          }`}
          aria-live="polite"
        >
          {charLimitReached ? t.convCharLimitReached : charCountLabel}
        </div>
      </div>

      {/* Expanded compose modal — roomy text entry */}
      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={t.convComposeTitle}
        closeLabel={t.cancelBtn}
        size="lg"
        footer={
          <>
            <span
              className={`conversation-charcount${
                charLimitReached ? " conversation-charcount--max" : ""
              }`}
            >
              {charLimitReached ? t.convCharLimitReached : charCountLabel}
            </span>
            <Button
              variant="subtle"
              onClick={() => setComposeOpen(false)}
            >
              {t.cancelBtn}
            </Button>
            <Button
              onClick={() => {
                setComposeOpen(false);
                sendStream();
              }}
              disabled={!input.trim() || loading || quotaReached}
            >
              {t.convBtnSendText}
            </Button>
          </>
        }
      >
        <Textarea
          className="conversation-compose-textarea"
          value={input}
          onChange={(e) => setInputClamped(e.target.value)}
          placeholder={t.convInputPlaceholder}
          aria-label={t.convInputAria}
          maxLength={MAX_QUESTION_CHARS}
          rows={10}
          autoFocus
        />
      </Modal>

      {/* Image preview modal */}
      <Modal
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        size="lg"
        closeLabel={t.cancelBtn}
        title={t.convImagePreviewAlt}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt={t.convImagePreviewAlt}
            className="conversation-preview-img"
          />
        )}
      </Modal>

      {/* Rename modal */}
      <Modal
        open={Boolean(renameData)}
        onClose={() => setRenameData(null)}
        title={t.convRenameTitle}
        closeLabel={t.cancelBtn}
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
        <Field label={t.convRenameTitle}>
          {({ id: fieldId, describedBy, invalid }) => (
            <Input
              id={fieldId}
              aria-describedby={describedBy}
              invalid={invalid}
              value={renameData?.title ?? ""}
              onChange={(e) => setRenameData({ title: e.target.value })}
              placeholder={t.convRenamePlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
            />
          )}
        </Field>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          try {
            await handleDelete();
            setShowDelete(false);
          } catch {
            toast.error(t.convDeleteError);
          }
        }}
        title={t.convDeleteTitle}
        message={t.convDeleteConfirm}
        confirmLabel={t.delete}
        cancelLabel={t.cancelBtn}
        closeLabel={t.cancelBtn}
        tone="danger"
      />
    </div>
  );
}
