/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import type { Message } from "../types/message";
import { UI_TEXT } from "../constants/uiText";
import { useSettings } from "../hooks/useSettings";
import "../styles/Conversation.css";

export default function Conversation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState<string>(t.convDefaultTitle);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [renameData, setRenameData] = useState<{ title: string } | null>(null);

  const startScanStream = async () => {
    stopRef.current = false;
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
        { method: "POST" },
      );

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        if (stopRef.current) break;

        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const data = line.replace("data: ", "");
          if (data === "[DONE]") break;

          const text = JSON.parse(data);
          await typeTextSlowly(text);
        }
      }
    } catch {
      setError(t.convStreamError);
    } finally {
      setLoading(false);
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

  const typeTextSlowly = async (text: string) => {
    for (const char of text) {
      if (stopRef.current) return;

      await new Promise((r) => setTimeout(r, 24));

      setMessages((m) => {
        const last = m[m.length - 1];
        if (!last || last.role !== "assistant") return m;
        return [...m.slice(0, -1), { ...last, content: last.content + char }];
      });
    }
  };

  const sendStream = async (langCode?: string) => {
    if (!input.trim() || loading) return;

    stopRef.current = false;
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
            lang: langCode ?? "vnm",
          }),
        },
      );

      if (!res.ok) throw new Error("Network error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        if (stopRef.current) break;

        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const data = line.replace("data: ", "");
          if (data === "[DONE]") break;

          const text = JSON.parse(data);
          await typeTextSlowly(text);
        }
      }
    } catch {
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
      {/* Header */}
      <header className="conversation__header">
        <button
          className="conversation__back-btn"
          onClick={() => navigate("/history")}
          aria-label={t.convBackToHistoryAria}
          title={t.convBackToHistoryTitle}
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

        <div className="conversation__title-section">
          <h1 className="conversation__title">{title}</h1>
        </div>

        <div className="conversation__header-actions">
          <button
            className="conversation__action-btn"
            onClick={() => setRenameData({ title })}
            title={t.convActionRename}
            aria-label={t.convActionRename}
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
            className="conversation__action-btn conversation__action-btn--danger"
            onClick={() => setShowDelete(true)}
            title={t.convActionDelete}
            aria-label={t.convActionDelete}
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
            const showCursor = loading && isLast && m.role === "assistant";

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
                      src={`data:${m.image.mimeType};base64,${m.image.buffer}`}
                      alt={t.convImageAlt}
                      className="conversation__image"
                      onClick={() =>
                        setPreviewImage(
                          `data:${m.image?.mimeType};base64,${m.image?.buffer}`,
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
                    <p className="conversation__text">
                      {m.content as string}
                      {showCursor && (
                        <span
                          className="conversation__cursor"
                          aria-hidden="true"
                        >
                          |
                        </span>
                      )}
                    </p>
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
            sendStream();
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
                setLoading(false);
              } else {
                sendStream();
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
            <h3>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: "8px",
                }}
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {t.convRenameTitle}
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
            <h3>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: "8px",
                }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {t.convDeleteTitle}
            </h3>
            <p>{t.convDeleteConfirm}</p>

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
