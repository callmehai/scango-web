/* eslint-disable @typescript-eslint/no-unused-vars */
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import type { Message } from "../types/message";

export default function Conversation() {
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState<string>("Conversation");
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stopRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get(`/conversations/${id}`)
      .then((res) => {
        setMessages(res.data.messages ?? []);
        setTitle(res.data.title ?? "Conversation");
      })
      .catch(() => {
        setMessages([
          {
            role: "assistant",
            content: "⚠️ Không tải được hội thoại",
            createdAt: new Date().toISOString(),
          },
        ]);
      });
  }, [id]);

  const deleteConversation = async () => {
    if (!window.confirm("Xóa toàn bộ cuộc trò chuyện?")) return;
    try {
      await api.delete(`/conversations/${id}`);
      navigate("/");
    } catch (err) {
      setError("Không thể xóa cuộc trò chuyện");
    }
  };

  const renameConversation = async () => {
    const newTitle = prompt("Đổi tên cuộc trò chuyện:", title);
    if (!newTitle?.trim()) return;
    try {
      await api.patch(`/conversations/${id}`, { title: newTitle });
      setTitle(newTitle);
    } catch (err) {
      setError("Không thể đổi tên cuộc trò chuyện");
    }
  };

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

  const sendStream = async () => {
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
            lang: "vi",
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
    } catch (err) {
      setError("Lỗi khi gửi tin nhắn. Vui lòng thử lại.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "❌ Đã xảy ra lỗi. Vui lòng thử lại.",
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

  return (
    <div className="conversation">
      {/* Header with title and actions */}
      <header className="conversation__header">
        <button
          className="conversation__back-btn"
          onClick={() => navigate("/")}
          aria-label="Back to home"
          title="Quay về trang chủ"
        >
          ←
        </button>

        <div className="conversation__title-section">
          <h1 className="conversation__title">{title}</h1>
        </div>

        <div className="conversation__header-actions">
          <button
            className="conversation__action-btn"
            onClick={renameConversation}
            aria-label="Rename conversation"
            title="Đổi tên"
          >
            ✏️
          </button>
          <button
            className="conversation__action-btn conversation__action-btn--danger"
            onClick={deleteConversation}
            aria-label="Delete conversation"
            title="Xóa"
          >
            🗑️
          </button>
        </div>
      </header>

      {/* Messages area */}
      <main
        className="conversation__body"
        role="log"
        aria-label="Chat messages"
      >
        {visibleMessages.length === 0 ? (
          <div className="conversation__empty">
            <p>Bắt đầu đặt câu hỏi về tài liệu của bạn</p>
          </div>
        ) : (
          visibleMessages.map((m, idx) => {
            const isLast = idx === visibleMessages.length - 1;
            const showCursor = loading && isLast && m.role === "assistant";

            return (
              <article
                key={idx}
                className={`conversation__message conversation__message--${m.role}`}
              >
                <div className="conversation__bubble">
                  <p className="conversation__text">
                    {m.content}
                    {showCursor && (
                      <span className="conversation__cursor" aria-hidden="true">
                        |
                      </span>
                    )}
                  </p>
                  {m.createdAt && (
                    <time className="conversation__timestamp">
                      {new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  )}
                </div>
              </article>
            );
          })
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </main>

      {/* Error message */}
      {error && (
        <div className="conversation__error" role="alert">
          {error}
        </div>
      )}

      {/* Input area */}
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
            placeholder="Nhập câu hỏi..."
            disabled={loading}
            aria-label="Message input"
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
            aria-label={loading ? "Stop generating" : "Send message"}
          >
            {loading ? (
              <>
                <span className="conversation__stop-icon">⛔</span>
                <span className="conversation__stop-text">Dừng</span>
              </>
            ) : (
              <>
                <span className="conversation__send-icon">➤</span>
                <span className="conversation__send-text">Gửi</span>
              </>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
}
