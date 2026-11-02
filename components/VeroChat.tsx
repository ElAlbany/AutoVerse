"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { signInUrl } from "@/lib/sign-in";

import { chatHistory } from "@/lib/chat-policy";
import {
  loadChatSession,
  type StoredChatMessage as Message,
  type ChatRecommendation as RecommendedCar,
} from "@/lib/chat-session";

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm **VERO**, your AutoVerse car assistant 🚗\n\nI can help you find the perfect car from our live fleet. To get started — what's your daily budget, and how many passengers will you have?",
};

const STORAGE_KEY = "vero-chat-session";

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return (
      <span key={i}>
        {part.split("\n").map((line, j, arr) => (
          <span key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-primary-blue dark:bg-accent-cyan"
          style={{
            animation: "vero-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function VeroChat() {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const storageKey = `${STORAGE_KEY}:${userId || "guest"}`;
  const [loadedKey, setLoadedKey] = useState("");
  const [failure, setFailure] = useState<{
    question: string;
    message: string;
  } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoaded) return;
    requestRef.current?.abort();
    requestRef.current = null;
    setStreaming(false);
    setIsTyping(false);
    setFailure(null);
    let stored = { messages: [] as Message[], draft: "" };
    try {
      stored = loadChatSession(localStorage.getItem(storageKey));
    } catch {}
    try {
      if (userId && sessionStorage.getItem("vero-pending-draft")) {
        stored.draft = sessionStorage
          .getItem("vero-pending-draft")!
          .slice(0, 3000);
        sessionStorage.removeItem("vero-pending-draft");
      }
    } catch {}
    setMessages(stored.messages.length ? stored.messages : [WELCOME]);
    setInput(stored.draft);
    setLoadedKey(storageKey);
  }, [storageKey, isLoaded, userId]);
  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          messages: messages.slice(-40),
          draft: input,
          timestamp: Date.now(),
        }),
      );
    } catch {
      /* Chat still works when browser storage is unavailable. */
    }
  }, [messages, input, loadedKey, storageKey]);
  useEffect(
    () => () => {
      requestRef.current?.abort();
      requestRef.current = null;
    },
    [],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (override?: string, retry = false) => {
      const text = (override ?? input).trim();
      if (!text || text.length > 3000 || requestRef.current || !isLoaded)
        return;
      if (!isSignedIn) {
        try {
          sessionStorage.setItem("vero-pending-draft", text);
        } catch {}
        router.push(
          signInUrl(window.location.pathname + window.location.search),
        );
        return;
      }
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };
      const history = chatHistory(
        (retry ? messages : messages.concat(userMsg)).filter(
          (m) => m.id !== "welcome",
        ),
      );
      if (!retry) setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setFailure(null);
      setIsTyping(true);
      setStreaming(true);
      const controller = new AbortController();
      requestRef.current = controller;
      const timer = setTimeout(() => controller.abort("timeout"), 35000);
      try {
        const query = new URLSearchParams(window.location.search);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history,
            branchId: query.get("branchId") || document.querySelector<HTMLElement>("[data-autoverse-branch]")?.dataset.autoverseBranch,
            start: query.get("start"),
            end: query.get("end"),
          }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "VERO is temporarily unavailable.");
        if (
          typeof data.text !== "string" ||
          !data.text.trim() ||
          !Array.isArray(data.recommendedCars)
        )
          throw new Error(
            "VERO returned an incomplete answer. Please try again.",
          );
        if (!controller.signal.aborted)
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: data.text,
              recommendations: data.recommendedCars as RecommendedCar[],
            },
          ]);
      } catch (error) {
        if (controller.signal.aborted && controller.signal.reason !== "timeout")
          return;
        setFailure({
          question: text,
          message: controller.signal.aborted
            ? "VERO took too long to respond. Please retry."
            : error instanceof Error
              ? error.message
              : "VERO is temporarily unavailable. Please retry.",
        });
      } finally {
        clearTimeout(timer);
        if (requestRef.current === controller) {
          requestRef.current = null;
          setIsTyping(false);
          setStreaming(false);
        }
      }
    },
    [input, messages, isSignedIn, isLoaded, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setMessages([WELCOME]);
    setInput("");
    setFailure(null);
    setIsTyping(false);
    setStreaming(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const toggleMaximize = () => setIsMaximized((v) => !v);

  const handleClose = () => {
    setOpen(false);
    setIsMaximized(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open VERO chat"
          className="
            fixed bottom-6 right-6 z-50
            w-14 h-14 rounded-full
            bg-primary-blue
            text-white shadow-lg
            flex items-center justify-center
            transition-all duration-300
            hover:scale-110 hover:shadow-primary-blue/40 hover:shadow-xl
          "
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2.5" />
          </svg>
        </button>
      )}

      {open && (
        <div
          className={`
            vero-window
            fixed z-50
            flex flex-col
            overflow-hidden
            shadow-2xl shadow-black/30 dark:shadow-black/60
            border border-gray-200 dark:border-dark-border
            bg-white dark:bg-dark-card
            transition-all duration-300 ease-out
            ${
              isMaximized
                ? "inset-y-0 right-0 w-full sm:w-[420px] md:w-[480px] lg:w-[520px] rounded-none sm:rounded-l-3xl border-r-0"
                : "bottom-24 right-4 w-[calc(100vw-2rem)] sm:right-6 sm:w-[380px] h-[min(520px,75dvh)] sm:h-[560px] rounded-xl"
            }
          `}
        >
          {/* Header */}
          <div
            className="
              flex items-center gap-3 px-5 py-4 flex-shrink-0
              bg-primary-blue
              relative overflow-hidden
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
            <div className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
              <span className="text-lg">🚗</span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">VERO</p>
              <p className="text-white/70 text-[11px] mt-0.5">
                AutoVerse Car Assistant
              </p>
            </div>

            <button
              onClick={toggleMaximize}
              title={isMaximized ? "Minimize" : "Maximize"}
              className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              {isMaximized ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>

            <button
              onClick={handleReset}
              title="New conversation"
              className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <button
              onClick={handleClose}
              title="Close chat"
              className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`vero-message flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-primary-blue flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-[13px]">
                    🚗
                  </div>
                )}

                <div className={isMaximized ? "max-w-[70%]" : "max-w-[78%]"}>
                  <div
                    className={`
                      px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${
                        msg.role === "user"
                          ? "bg-primary-blue text-white rounded-br-sm"
                          : "bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-dark-text rounded-bl-sm border border-gray-200 dark:border-dark-border"
                      }
                      transition-colors duration-500
                    `}
                  >
                    {msg.role === "assistant"
                      ? renderMarkdown(msg.content)
                      : msg.content}
                  </div>

                  {msg.role === "assistant" &&
                    msg.recommendations &&
                    msg.recommendations.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.recommendations.map((car) => (
                          <a
                            key={car.id}
                            href={
                              car.href ||
                              `/rent?${new URLSearchParams({ carId: car.id })}`
                            }
                            className="block p-2.5 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border hover:border-primary-blue dark:hover:border-primary-blue transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {car.image && (
                                <img
                                  src={car.image}
                                  alt={car.name}
                                  className="w-12 h-12 object-contain rounded-lg bg-gray-50 dark:bg-white/5"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                                  {car.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-dark-muted">
                                  {car.class} · ${car.pricePerDay}/day
                                </p>
                              </div>
                              <span className="text-xs font-medium text-primary-blue dark:text-accent-cyan whitespace-nowrap">
                                Book →
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="vero-message flex justify-start">
                <div className="w-7 h-7 rounded-full bg-primary-blue flex items-center justify-center flex-shrink-0 mr-2 mt-0.5 text-[13px]">
                  🚗
                </div>
                <div className="bg-gray-100 dark:bg-dark-surface rounded-2xl rounded-bl-sm border border-gray-200 dark:border-dark-border transition-colors duration-500">
                  <TypingDots />
                </div>
              </div>
            )}

            {failure && (
              <div className="av-alert" role="alert">
                <p>{failure.message}</p>
                <button
                  type="button"
                  className="av-text-link mt-2"
                  onClick={() => sendMessage(failure.question, true)}
                  disabled={streaming}
                >
                  Retry last question
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="h-px bg-gray-100 dark:bg-dark-border flex-shrink-0 transition-colors duration-500" />

          <div className="flex items-end gap-2 px-4 py-3 flex-shrink-0 bg-white dark:bg-dark-card transition-colors duration-500">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 80) + "px";
              }}
              onKeyDown={handleKeyDown}
              disabled={streaming}
              maxLength={3000}
              aria-label="Message VERO"
              placeholder="Ask VERO about your next rental…"
              rows={1}
              className="
                flex-1 resize-none rounded-xl px-3.5 py-2.5 text-sm
                bg-gray-50 dark:bg-dark-surface
                text-gray-900 dark:text-dark-text
                placeholder:text-gray-400 dark:placeholder:text-dark-muted
                border border-gray-200 dark:border-dark-border
                focus:outline-none focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue
                disabled:opacity-50
                transition-all duration-300
                leading-relaxed
              "
              style={{ maxHeight: "80px", overflowY: "auto" }}
            />

            <button
              onClick={() => sendMessage()}
              disabled={!isLoaded || !input.trim() || streaming}
              aria-label="Send message"
              className="
                w-10 h-10 rounded-xl flex-shrink-0
                bg-primary-blue
                text-white flex items-center justify-center
                transition-all duration-200
                hover:shadow-lg hover:shadow-primary-blue/30 hover:scale-105
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
              "
            >
              {streaming ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-spin"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22 11 13 2 9l20-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="pb-2 flex justify-center flex-shrink-0">
            <p className="text-[10px] text-gray-300 dark:text-dark-border transition-colors duration-500">
              Powered by Gemini · AutoVerse
            </p>
          </div>
        </div>
      )}
    </>
  );
}
