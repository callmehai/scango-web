import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import type { Message } from "../types/message";
import { UI_TEXT } from "../constants/uiText";
import { useSettings } from "../hooks/useSettings";
import "../styles/Conversation.css";
import ReactMarkdown from "react-markdown";
import ActionMenu from "../components/ActionMenu";

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

  const { systemLang, targetLang } = useSettings();
  const t = UI_TEXT[systemLang];

  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState<string>(t.convDefaultTitle);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [renameData, setRenameData] = useState<{ title: string } | null>(null);

  // Cleanup on unmount — abort any in-flight stream
  useEffect(() => {
    return () => {
      stopRef.current = true;
      abortRef.current?.abort();
    };
  }, []);

  // Append SSE chunk straight to the assistant message. No fake typing — the
  // network already delivers tokens at a natural pace; re-buffering through a
  // worker introduced visible "stop/start" jitter.
  const appendAssistantText = (text: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") return prev;
      return [...prev.slice(0, -1), { ...last, content: last.content + text }];
    });
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
      const res = await fetch(
        `${api.defaults.baseURL}/conversations/${id}/scan-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        },
      );

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
          setTitle(res.data.title ?? t.convDefaultTitle);
        });
      }, 500);
    }
  };

  useEffect(() => {
    if (!id) return;

    api.get(`/conversations/${id}`).then((res) => {
      const msgs = res.data.messages ?? [];

      setMessages(msgs);
      setTitle(res.data.title ?? t.convDefaultTitle);

      const hasImage = msgs.some((m: Message) => m.role === "image");
      const hasAssistantInDB = msgs.some(
        (m: Message) => m.role === "assistant",
      );

      if (hasImage && !hasAssistantInDB) {
        startScanStream();
      }
    });
  }, [id]);

  const sendStream = async (langCode: string) => {
    if (!input.trim() || loading) return;

    stopRef.current = false;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

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
      const res = await fetch(
        `${api.defaults.baseURL}/conversations/${id}/ask-stream`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: userMsg.content,
            lang: langCode,
          }),
          signal: controller.signal,
        },
      );

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const visibleMessages = messages.filter((m) => m.role !== "system");

  const handleRename = async () => {
    if (!renameData || !renameData.title.trim()) return;

    try {
      await api.patch(`/conversations/${id}`, {
        title: renameData.title,
      });
      setTitle(renameData.title);
      setRenameData(null);
    } catch {
      setError(t.convRenameError);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/conversations/${id}`);
      navigate("/history");
    } catch {
      setError(t.convDeleteError);
    }
  };

  return (
    <div className="conversation">
      {/* Header — back button rendered globally via <BackButton /> in App.tsx */}
      <header className="conversation__header">
        <div className="conversation__title-section">
          <h1 className="conversation__title">{title}</h1>
        </div>

        <div className="conversation__header-actions">
          <ActionMenu
            ariaLabel={t.convActionRename}
            items={[
              {
                label: t.convActionRename,
                icon: (
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
                ),
                onSelect: () => setRenameData({ title }),
              },
              {
                label: t.convActionDelete,
                danger: true,
                icon: (
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
                ),
                onSelect: () => setShowDelete(true),
              },
            ]}
          />
        </div>
      </header>

      {/* Messages */}
      <main
        className="conversation__body"
        role="log"
        aria-label="Chat messages"
      >
        {visibleMessages.length === 0 ? (
          <div className="conversation__empty">
            <p>{t.convEmptyText}</p>
          </div>
        ) : (
          visibleMessages.map((m, idx) => {
            const isLast = idx === visibleMessages.length - 1;

            return (
              <article
                key={idx}
                className={`conversation__message conversation__message--${m.role} ${
                  loading && isLast && m.role === "assistant"
                    ? "generating"
                    : ""
                }`}
              >
                <div className="conversation__bubble">
                  {m.role === "image" && m.image ? (
                    <img
                      src={`${api.defaults.baseURL}/conversations/${id}/image`}
                      alt={t.convImageAlt}
                      className="conversation__image"
                      onClick={() =>
                        setPreviewImage(
                          `${api.defaults.baseURL}/conversations/${id}/image`,
                        )
                      }
                      style={{ cursor: "pointer" }}
                    />
                  ) : m.role === "assistant" && loading && m.content === "" ? (
                    <div className="conversation__typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <div className="conversation__text">
                      <ReactMarkdown>{m.content as string}</ReactMarkdown>
                    </div>
                  )}

                  {m.createdAt && (
                    <time className="conversation__timestamp">
                      {new Date(m.createdAt).toLocaleTimeString(
                        systemLang === "vi" ? "vi-VN" : "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </time>
                  )}
                </div>
              </article>
            );
          })
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </main>

      {/* Image preview modal */}
      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt={t.convImagePreviewAlt} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="conversation__error" role="alert">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Input */}
      <footer className="conversation__input-section">
        <form
          className="conversation__input-form"
          onSubmit={(e) => {
            e.preventDefault();
            sendStream(targetLang);
          }}
        >
          <input
            ref={inputRef}
            className="conversation__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.convInputPlaceholder}
            disabled={loading}
            aria-label={t.convInputAria}
          />

          <button
            className={`conversation__send-btn ${
              loading ? "conversation__send-btn--loading" : ""
            }`}
            disabled={!input.trim() && !loading}
            onClick={() => {
              if (loading) {
                stopRef.current = true;
                abortRef.current?.abort();
                setLoading(false);
              } else {
                sendStream(targetLang);
              }
            }}
            type="button"
            aria-label={loading ? t.convStopAria : t.convSendAria}
          >
            {loading ? (
              <>
                <span className="conversation__stop-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </span>
                <span className="conversation__stop-text">
                  {t.convBtnStopText}
                </span>
              </>
            ) : (
              <>
                <span className="conversation__send-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </span>
                <span className="conversation__send-text">
                  {t.convBtnSendText}
                </span>
              </>
            )}
          </button>
        </form>
      </footer>

      {/* Rename modal */}
      {renameData && (
        <div className="modal-overlay" onClick={() => setRenameData(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">
              <svg
                width="20"
                height="20"
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
              <span>{t.convRenameTitle}</span>
            </h3>

            <input
              className="modal-input"
              value={renameData.title}
              onChange={(e) => setRenameData({ title: e.target.value })}
              placeholder={t.convRenamePlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenameData(null);
              }}
            />

            <div className="modal-actions">
              <button
                className="btn btn--cancel"
                onClick={() => setRenameData(null)}
              >
                {t.cancelBtn}
              </button>
              <button
                className="btn btn--primary"
                onClick={handleRename}
                disabled={!renameData.title.trim()}
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title modal-title--danger">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{t.convDeleteTitle}</span>
            </h3>
            <p className="modal-text">{t.convDeleteConfirm}</p>

            <div className="modal-actions">
              <button
                className="btn btn--cancel"
                onClick={() => setShowDelete(false)}
              >
                {t.cancelBtn}
              </button>
              <button className="btn btn--danger" onClick={handleDelete}>
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
