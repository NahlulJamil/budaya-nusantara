"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import {
  AlertIcon,
  PlusIcon,
  RefreshIcon,
} from "@/components/ui/icons";
import { CATEGORY_LABELS } from "@/lib/api";
import {
  ChatbotApiError,
  fetchChatSession,
  fetchChatSessions,
  fetchContentContext,
  sendChatMessage,
  type ChatContentContext,
  type ChatSessionListItem,
  type ChatSender,
} from "@/lib/chatbotApi";
import type { CulturalCategory } from "@/lib/types";
import { clearUserToken, readUserToken } from "@/lib/userApi";

const MAX_MESSAGE = 2000;

const SUGGESTIONS = [
  "Apa makna tradisi Sekaten?",
  "Makanan khas Sulawesi Utara apa saja?",
  "Bagaimana cara mengunggah foto ke Galeri?",
];

interface UiMessage {
  id: string;
  sender: ChatSender;
  message: string;
  outOfScope?: boolean;
  needsClarification?: boolean;
}

function formatSessionDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function MessageBubble({ item }: { item: UiMessage }) {
  const isUser = item.sender === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
          isUser ? "bg-night text-[#f6f2e7]" : "bg-cream-deep text-ink"
        }`}
      >
        {isUser ? "K" : "KB"}
      </span>
      <div
        className={`max-w-[86%] rounded-xl px-3.5 py-2.5 text-[13px] leading-[1.7] ${
          isUser
            ? "bg-night text-[#f6f2e7]"
            : "border border-line bg-cream/60 text-ink"
        }`}
      >
        <p className="whitespace-pre-line">{item.message}</p>
        {item.outOfScope ? (
          <p
            className={`mt-2 text-[10px] font-medium tracking-[0.08em] uppercase ${
              isUser ? "text-[#c8c1b0]" : "text-muted"
            }`}
          >
            Di luar cakupan
          </p>
        ) : null}
        {item.needsClarification ? (
          <p
            className={`mt-2 text-[10px] font-medium tracking-[0.08em] uppercase ${
              isUser ? "text-[#c8c1b0]" : "text-muted"
            }`}
          >
            Perlu klarifikasi
          </p>
        ) : null}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream-deep text-[10px] font-medium text-ink"
      >
        KB
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-cream/60 px-3.5 py-3">
        <span aria-hidden="true" className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
        </span>
        <span className="text-[11.5px] text-muted">
          Kanca Budaya sedang menulis...
        </span>
      </div>
    </div>
  );
}

function WelcomePanel({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-cream/60 p-5">
      <p className="font-serif text-[20px] leading-tight text-ink">
        Halo, aku Kanca Budaya.
      </p>
      <p className="mt-2 max-w-[520px] text-[12.5px] leading-[1.8] text-muted">
        Aku khusus membantu pertanyaan seputar budaya Indonesia — tradisi,
        pakaian adat, makanan daerah, alat musik, aksara — serta cara memakai
        fitur website ini. Di luar topik itu, aku akan menolak dengan sopan.
      </p>
      <p className="mt-3 text-[11px] leading-[1.7] text-muted">
        Jawaban berasal dari AI dan bisa keliru. Tetap cek sumber lain untuk hal
        yang penting.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="focus-ring rounded-full border border-line bg-paper px-3 py-1.5 text-[11px] text-ink transition-colors hover:border-ink/40 hover:bg-white"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatbotScreen({
  initialContentId,
}: {
  initialContentId?: number;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [sessions, setSessions] = useState<ChatSessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionsKey, setSessionsKey] = useState(0);

  const [context, setContext] = useState<ChatContentContext | null>(null);
  const [initialContext, setInitialContext] =
    useState<ChatContentContext | null>(null);

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [loadSessionError, setLoadSessionError] = useState<string | null>(null);
  const [failedSessionId, setFailedSessionId] = useState<number | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession(): Promise<void> {
      await Promise.resolve();

      if (active) {
        setToken(readUserToken());
      }
    }

    void restoreSession().finally(() => {
      if (active) {
        setSessionReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Konteks halaman: `?content_id=` divalidasi lewat endpoint publik konten.
  useEffect(() => {
    if (!initialContentId) {
      return;
    }

    let active = true;

    fetchContentContext(initialContentId)
      .then((data) => {
        if (!active) {
          return;
        }

        const next: ChatContentContext = {
          id: data.id,
          title: data.title,
          category: data.category,
        };

        setInitialContext(next);
        setContext(next);
      })
      .catch(() => {
        // Konteks opsional: tanpa judul, percakapan tetap bisa berjalan.
      });

    return () => {
      active = false;
    };
  }, [initialContentId]);

  useEffect(() => {
    if (!sessionReady || !token) {
      return;
    }

    let active = true;

    fetchChatSessions(token)
      .then((response) => {
        if (!active) {
          return;
        }

        setSessions(response.data);
        setSessionsError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }

        if (cause instanceof ChatbotApiError && cause.status === 401) {
          clearUserToken();
          setToken(null);
          setSessionExpired(true);
          return;
        }

        setSessionsError(
          cause instanceof ChatbotApiError
            ? cause.message
            : "Gagal memuat daftar percakapan.",
        );
      })
      .finally(() => {
        if (active) {
          setSessionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [sessionReady, token, sessionsKey]);

  useEffect(() => {
    const element = listRef.current;

    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, sending, loadingSession]);

  async function sendMessage(raw: string): Promise<void> {
    if (!token || sending) {
      return;
    }

    const text = raw.trim();

    if (!text) {
      setChatError("Tulis pesan atau pertanyaan terlebih dahulu.");
      return;
    }

    if (text.length > MAX_MESSAGE) {
      setChatError(`Pesan maksimal ${MAX_MESSAGE} karakter.`);
      return;
    }

    const tempId = `temp-${Date.now()}`;

    setChatError(null);
    setFailedMessage(null);
    setInput("");
    setMessages((current) => [
      ...current,
      { id: tempId, sender: "user", message: text },
    ]);
    setSending(true);

    try {
      const data = await sendChatMessage(token, {
        message: text,
        sessionId: activeSessionId,
        currentContentId: context?.id,
      });

      setActiveSessionId(data.session.id);
      setMessages((current) => [
        ...current.filter((item) => item.id !== tempId),
        {
          id: `user-${data.user_message.id}`,
          sender: "user",
          message: data.user_message.message,
        },
        {
          id: `assistant-${data.reply.id}`,
          sender: "assistant",
          message: data.reply.message,
          outOfScope: data.out_of_scope,
          needsClarification: data.needs_clarification,
        },
      ]);
      setSessionsKey((key) => key + 1);
    } catch (cause) {
      setMessages((current) => current.filter((item) => item.id !== tempId));
      setInput(text);
      setFailedMessage(text);

      if (cause instanceof ChatbotApiError) {
        if (cause.status === 401) {
          clearUserToken();
          setToken(null);
          setSessionExpired(true);
          return;
        }

        setChatError(cause.errors.message?.[0] ?? cause.message);
      } else {
        setChatError("Terjadi kesalahan yang tidak terduga. Coba lagi.");
      }
    } finally {
      setSending(false);
    }
  }

  async function selectSession(id: number): Promise<void> {
    if (!token || sending) {
      return;
    }

    setLoadingSession(true);
    setLoadSessionError(null);
    setFailedSessionId(null);
    setChatError(null);
    setFailedMessage(null);

    try {
      const detail = await fetchChatSession(token, id);

      setActiveSessionId(detail.id);
      setFailedSessionId(null);
      setMessages(
        detail.messages.map((item) => ({
          id: `${item.sender}-${item.id}`,
          sender: item.sender,
          message: item.message,
        })),
      );
      setContext(
        detail.current_content
          ? { id: detail.current_content.id, title: detail.current_content.title }
          : initialContext,
      );
    } catch (cause) {
      if (cause instanceof ChatbotApiError) {
        if (cause.status === 401) {
          clearUserToken();
          setToken(null);
          setSessionExpired(true);
          return;
        }

        setLoadSessionError(cause.message);
      } else {
        setLoadSessionError("Gagal memuat percakapan. Coba lagi.");
      }

      setFailedSessionId(id);
    } finally {
      setLoadingSession(false);
    }
  }

  function startNewConversation(): void {
    if (sending) {
      return;
    }

    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setChatError(null);
    setFailedMessage(null);
    setLoadSessionError(null);
    setFailedSessionId(null);
    setContext(initialContext);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  }

  const contextLabel = context
    ? `${context.title}${
        context.category
          ? ` · ${CATEGORY_LABELS[context.category as CulturalCategory] ?? context.category}`
          : ""
      }`
    : null;

  return (
    <main id="main" className="pb-20">
      <div className="shell pt-14 sm:pt-16 lg:pt-20">
        <header className="max-w-[700px]">
          <p className="eyebrow">Chatbot Budaya</p>
          <h1 className="mt-3 font-serif text-[clamp(34px,4.4vw,52px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
            Kanca Budaya
          </h1>
          <p className="mt-4 text-[13px] leading-[1.8] text-muted">
            Asisten AI yang berfokus pada budaya Indonesia dan cara memakai
            website ini. Percakapan disimpan pada akunmu, bukan di browser.
          </p>
        </header>

        {!sessionReady ? (
          <div
            aria-busy="true"
            aria-label="Memeriksa sesi"
            className="mt-8 h-64 rounded-xl skeleton"
          />
        ) : null}

        {sessionReady && !token ? (
          <section
            aria-labelledby="chatbot-masuk-heading"
            className="mt-8 rounded-xl border border-line bg-paper p-5 sm:p-7"
          >
            {sessionExpired ? (
              <p
                role="alert"
                className="mb-5 flex items-start gap-2 rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12.5px] leading-[1.7] text-ink"
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Sesi akun tidak ditemukan atau sudah berakhir. Masuk lagi
                  untuk melanjutkan percakapan.
                </span>
              </p>
            ) : null}

            <h2
              id="chatbot-masuk-heading"
              className="font-serif text-[22px] leading-tight text-ink"
            >
              Masuk untuk mulai mengobrol
            </h2>
            <p className="mt-2 max-w-[540px] text-[12.5px] leading-[1.8] text-muted">
              Kanca Budaya memerlukan akun agar percakapan bisa disimpan dan
              dilanjutkan kapan saja. Masuk dengan akun yang sudah ada, atau
              buat akun baru lebih dulu.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/galeri#masuk"
                className="focus-ring inline-flex h-10 items-center rounded-lg bg-night px-4 text-[12px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Masuk
              </Link>
              <Link
                href="/registrasi"
                className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                Buat akun
              </Link>
            </div>
            <p className="mt-4 text-[11px] leading-[1.7] text-muted">
              Setelah masuk, kembali ke halaman ini untuk memulai percakapan.
            </p>
          </section>
        ) : null}

        {sessionReady && token ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)] lg:items-start">
            <aside aria-label="Daftar percakapan">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-[20px] leading-tight text-ink">
                  Percakapan
                </h2>
                <button
                  type="button"
                  onClick={startNewConversation}
                  disabled={sending}
                  className="focus-ring inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 text-[11px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlusIcon className="h-3 w-3" />
                  Baru
                </button>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                {sessionsLoading ? (
                  <div className="flex gap-2 lg:block lg:space-y-2" aria-hidden="true">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={index}
                        className="skeleton h-16 min-w-[190px] rounded-lg lg:w-full lg:min-w-0"
                      />
                    ))}
                  </div>
                ) : null}

                {!sessionsLoading && sessionsError ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11.5px] leading-[1.6] text-red-800">
                    <p>{sessionsError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSessionsLoading(true);
                        setSessionsKey((key) => key + 1);
                      }}
                      className="focus-ring mt-2 inline-flex items-center gap-1 rounded-md border border-red-200 bg-paper px-2 py-0.5 text-[11px] font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      <RefreshIcon className="h-3 w-3" />
                      Coba lagi
                    </button>
                  </div>
                ) : null}

                {!sessionsLoading && !sessionsError && sessions.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line bg-paper px-3 py-4 text-[11.5px] leading-[1.7] text-muted">
                    Belum ada percakapan tersimpan. Kirim pesan pertama untuk
                    memulai.
                  </p>
                ) : null}

                {!sessionsLoading && !sessionsError
                  ? sessions.map((session) => {
                      const active = session.id === activeSessionId;
                      const title =
                        session.current_content?.title ??
                        `Percakapan #${session.id}`;

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => void selectSession(session.id)}
                          aria-current={active ? "true" : undefined}
                          className={`focus-ring block min-w-[190px] rounded-lg border px-3 py-2.5 text-left transition-colors lg:w-full lg:min-w-0 ${
                            active
                              ? "border-night bg-night text-[#f6f2e7]"
                              : "border-line bg-paper text-ink hover:border-ink/40 hover:bg-white"
                          }`}
                        >
                          <span className="block truncate text-[12.5px] font-medium">
                            {title}
                          </span>
                          <span
                            className={`mt-1 block text-[10.5px] ${
                              active ? "text-[#c8c1b0]" : "text-muted"
                            }`}
                          >
                            {session.messages_count} pesan
                            {session.updated_at
                              ? ` · ${formatSessionDate(session.updated_at)}`
                              : ""}
                          </span>
                        </button>
                      );
                    })
                  : null}
              </div>
            </aside>

            <section
              aria-label="Percakapan dengan Kanca Budaya"
              className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-line bg-paper"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-deep text-[10.5px] font-medium text-ink"
                  >
                    KB
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-ink">
                      Kanca Budaya
                    </p>
                    <p className="text-[10.5px] text-muted">
                      Asisten budaya Indonesia
                    </p>
                  </div>
                </div>

                {contextLabel ? (
                  <p className="max-w-[260px] truncate rounded-full border border-line bg-cream px-3 py-1 text-[10.5px] text-muted">
                    Konteks: {contextLabel}
                  </p>
                ) : null}
              </div>

              <div
                ref={listRef}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
                style={{ maxHeight: "min(58vh, 520px)" }}
              >
                {loadingSession ? (
                  <div className="space-y-3" aria-hidden="true">
                    <div className="skeleton h-16 w-3/4 rounded-xl" />
                    <div className="skeleton ml-auto h-16 w-2/3 rounded-xl" />
                    <div className="skeleton h-16 w-3/4 rounded-xl" />
                  </div>
                ) : null}

                {!loadingSession && loadSessionError ? (
                  <div
                    role="alert"
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-[1.7] text-red-800"
                  >
                    <AlertIcon className="h-4 w-4 shrink-0" />
                    <span>{loadSessionError}</span>
                    {failedSessionId ? (
                      <button
                        type="button"
                        onClick={() => void selectSession(failedSessionId)}
                        className="focus-ring ml-auto inline-flex items-center gap-1 rounded-md border border-red-200 bg-paper px-2 py-0.5 text-[11px] font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        <RefreshIcon className="h-3 w-3" />
                        Coba lagi
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {!loadingSession && !loadSessionError && messages.length === 0 ? (
                  <WelcomePanel onPick={setInput} />
                ) : null}

                {!loadingSession
                  ? messages.map((item) => (
                      <MessageBubble key={item.id} item={item} />
                    ))
                  : null}

                {sending ? <TypingIndicator /> : null}
              </div>

              {chatError ? (
                <div
                  role="alert"
                  className="mx-3 mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] leading-[1.65] text-red-800 sm:mx-4"
                >
                  <AlertIcon className="h-4 w-4 shrink-0" />
                  <span>{chatError}</span>
                  {failedMessage ? (
                    <button
                      type="button"
                      onClick={() => void sendMessage(failedMessage)}
                      className="focus-ring ml-auto inline-flex items-center gap-1 rounded-md border border-red-200 bg-paper px-2 py-0.5 text-[11px] font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      <RefreshIcon className="h-3 w-3" />
                      Coba lagi
                    </button>
                  ) : null}
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit}
                className="mt-3 border-t border-line p-3 sm:p-4"
              >
                <div className="flex items-end gap-2">
                  <label htmlFor="chatbot-message" className="sr-only">
                    Pesan untuk Kanca Budaya
                  </label>
                  <textarea
                    id="chatbot-message"
                    rows={2}
                    value={input}
                    maxLength={MAX_MESSAGE}
                    disabled={sending}
                    onChange={(event) => {
                      setInput(event.target.value);
                      setChatError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Tanya tentang budaya Indonesia atau cara memakai website ini..."
                    className="focus-ring min-h-[52px] w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-[13px] leading-[1.6] text-ink outline-none transition-colors focus:border-ink/40 disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted"
                  />
                  <button
                    type="submit"
                    disabled={sending || input.trim().length === 0}
                    className="focus-ring inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? "Mengirim..." : "Kirim"}
                  </button>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10.5px] text-muted">
                    Enter untuk kirim · Shift+Enter baris baru
                  </p>
                  <p className="text-[10.5px] text-muted">
                    {input.length}/{MAX_MESSAGE}
                  </p>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
