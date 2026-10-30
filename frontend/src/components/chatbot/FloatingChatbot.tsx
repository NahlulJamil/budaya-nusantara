"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import {
  ChatbotApiError,
  fetchChatSession,
  fetchContentContext,
  sendChatMessage,
  type ChatContentContext,
  type ChatSender,
} from "@/lib/chatbotApi";
import { readUserToken } from "@/lib/userApi";

const MAX_MESSAGE = 2000;
const SESSION_STORAGE_KEY = "kanca_budaya_widget_session_id";

const SUGGESTIONS = [
  "Apa makna tradisi Sekaten di Jawa?",
  "Alat musik tradisional dari Sunda apa saja?",
  "Bagaimana cara mengunggah foto ke Galeri?",
  "Apa filosofi rumah adat Tongkonan di Toraja?",
];

interface UiMessage {
  id: string;
  sender: ChatSender;
  message: string;
  outOfScope?: boolean;
  needsClarification?: boolean;
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function ChatBubbleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

function RefreshIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 5v6h-6" />
    </svg>
  );
}

function ArrowUpRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function FloatingChatbotContent() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [context, setContext] = useState<ChatContentContext | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const msgIdCounter = useRef(1);

  // Jangan tampilkan widget melayang di halaman penuh /chatbot dan area admin.
  const isDedicatedChatbotPage =
    pathname?.startsWith("/chatbot") || pathname?.startsWith("/admin");

  // Sinkronisasi status autentikasi pengguna
  useEffect(() => {
    let active = true;

    async function checkAuth(): Promise<void> {
      await Promise.resolve();
      if (!active) return;
      const currentToken = readUserToken();
      setToken(currentToken);
      setSessionReady(true);
    }

    void checkAuth();

    function onStorage() {
      void checkAuth();
    }

    // Dengar event jika token berubah antar tab atau saat login/logout
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Periksa apakah sedang membuka halaman detail budaya (misal /budaya/12)
  useEffect(() => {
    if (!pathname) return;

    let active = true;
    const match = pathname.match(/^\/budaya\/(\d+)$/);

    async function syncContext(): Promise<void> {
      await Promise.resolve();
      if (!active) return;

      if (match && match[1]) {
        const cultureId = Number(match[1]);
        if (cultureId > 0) {
          try {
            const data = await fetchContentContext(cultureId);
            if (active) {
              setContext({
                id: data.id,
                title: data.title,
                category: data.category,
              });
            }
          } catch {
            // Konteks halaman bersifat opsional
          }
          return;
        }
      }

      setContext(null);
    }

    void syncContext();

    return () => {
      active = false;
    };
  }, [pathname]);

  // Pulihkan sesi chat terakhir dari sessionStorage bila ada
  useEffect(() => {
    if (!token || !sessionReady) return;

    const savedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!savedSessionId) return;

    const sessionId = Number(savedSessionId);
    if (!Number.isInteger(sessionId) || sessionId <= 0) return;

    let active = true;

    async function restoreChatHistory(): Promise<void> {
      await Promise.resolve();
      if (!active) return;
      setLoadingHistory(true);

      try {
        const data = await fetchChatSession(token!, sessionId);
        if (!active) return;
        setActiveSessionId(data.id);
        setMessages(
          data.messages.map((m) => ({
            id: String(m.id),
            sender: m.sender,
            message: m.message,
          }))
        );
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    void restoreChatHistory();

    return () => {
      active = false;
    };
  }, [token, sessionReady]);

  // Otomatis scroll ke bawah saat pesan baru tiba
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending, isOpen]);

  // Fokuskan input saat widget dibuka
  useEffect(() => {
    if (isOpen && token && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, token]);

  async function handleSendMessage(textToSend: string): Promise<void> {
    const trimmed = textToSend.trim();
    if (!trimmed || sending) return;

    if (!token) {
      setChatError("Silakan masuk akun terlebih dahulu.");
      return;
    }

    if (trimmed.length > MAX_MESSAGE) {
      setChatError(`Pesan maksimal ${MAX_MESSAGE} karakter.`);
      return;
    }

    const tempId = `temp-${msgIdCounter.current++}`;
    setChatError(null);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: tempId, sender: "user", message: trimmed },
    ]);
    setSending(true);

    try {
      const res = await sendChatMessage(token, {
        message: trimmed,
        sessionId: activeSessionId,
        currentContentId: context?.id ?? null,
      });

      setActiveSessionId(res.session.id);
      sessionStorage.setItem(SESSION_STORAGE_KEY, String(res.session.id));

      setMessages((prev) => [
        ...prev,
        {
          id: String(res.reply.id),
          sender: "assistant",
          message: res.reply.message,
          outOfScope: res.out_of_scope,
          needsClarification: res.needs_clarification,
        },
      ]);
    } catch (err) {
      if (err instanceof ChatbotApiError) {
        setChatError(err.message);
      } else {
        setChatError("Gagal mengirim pesan. Silakan coba lagi.");
      }
    } finally {
      setSending(false);
    }
  }

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSendMessage(input);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage(input);
    }
  };

  const handleStartNewChat = () => {
    if (sending) return;
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setChatError(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  if (isDedicatedChatbotPage) {
    return null;
  }

  return (
    <aside
      aria-label="Asisten AI Kanca Budaya"
      className="fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6"
    >
      {/* Tombol Peluncur Mengambang (Floating Launcher) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-label="Buka Chatbot AI Kanca Budaya"
          className="group relative flex items-center gap-2.5 rounded-full border border-amber/40 bg-night py-2.5 pr-4 pl-3.5 text-[#f6f2e7] shadow-xl transition-all duration-200 hover:scale-105 hover:border-amber hover:shadow-2xl active:scale-95"
        >
          {/* Avatar Icon dengan Indikator Aktif */}
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber/30 to-amber/10 text-amber">
            <SparklesIcon className="h-4 w-4 animate-pulse" />
            <span
              className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-night bg-emerald-500"
              aria-hidden="true"
            />
          </span>

          <div className="text-left">
            <span className="flex items-center gap-1.5 text-[13px] font-medium tracking-tight text-[#f6f2e7]">
              Kanca Budaya
              <span className="rounded bg-amber/20 px-1.5 py-0.2 text-[9.5px] font-semibold text-amber uppercase">
                AI
              </span>
            </span>
            <span className="block text-[10.5px] text-[#c4bdae]">
              Tanya Budaya Nusantara
            </span>
          </div>
        </button>
      )}

      {/* Jendela Chat Kecil (Compact Chatbot Window) */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Kanca Budaya Chat"
          className="flex h-[520px] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-2xl transition-all duration-200 animate-in fade-in zoom-in-95 sm:w-[380px]"
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-line/20 bg-night px-4 py-3 text-[#f6f2e7]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber/20 font-serif text-[13px] font-semibold text-amber">
                KB
                <span
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-night bg-emerald-500"
                  aria-hidden="true"
                />
              </span>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <h3 className="font-serif text-[15px] font-normal text-[#f6f2e7]">
                    Kanca Budaya
                  </h3>
                  <span className="rounded bg-amber/25 px-1 py-0.2 text-[9px] font-semibold text-amber">
                    AI
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#c8c1b0]">
                  Asisten Budaya Nusantara
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Tombol Percakapan Baru */}
              {token && messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartNewChat}
                  title="Percakapan baru"
                  aria-label="Mulai percakapan baru"
                  className="rounded-lg p-1.5 text-[#c8c1b0] transition-colors hover:bg-white/10 hover:text-white"
                >
                  <RefreshIcon className="h-4 w-4" />
                </button>
              )}

              {/* Tautan ke Halaman Chatbot Penuh */}
              <Link
                href="/chatbot"
                title="Buka tampilan layar penuh"
                aria-label="Buka tampilan layar penuh"
                className="rounded-lg p-1.5 text-[#c8c1b0] transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>

              {/* Tombol Tutup / Minimalkan */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Tutup chatbot"
                aria-label="Tutup jendela chat"
                className="rounded-lg p-1.5 text-[#c8c1b0] transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Konteks Halaman Aktif (Bila sedang di /budaya/[id]) */}
          {context && (
            <div className="flex items-center justify-between border-b border-line/60 bg-cream-deep/60 px-3.5 py-1.5 text-[11px] text-ink">
              <span className="truncate">
                <span className="font-medium text-muted">Konteks:</span>{" "}
                <strong className="font-semibold text-ink">{context.title}</strong>
              </span>
              <button
                type="button"
                onClick={() => setContext(null)}
                title="Lepas konteks halaman"
                aria-label="Lepas konteks halaman"
                className="ml-2 text-muted hover:text-ink"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Area Pesan Chat */}
          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto bg-cream/30 p-3.5"
          >
            {/* Status Jika Pengguna Belum Masuk (Unauthenticated) */}
            {sessionReady && !token && (
              <div className="rounded-xl border border-line bg-paper p-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-cream-deep text-ink">
                  <ChatBubbleIcon className="h-5 w-5 text-amber" />
                </div>
                <h4 className="mt-2.5 font-serif text-[15px] font-medium text-ink">
                  Halo! Aku Kanca Budaya
                </h4>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
                  Masuk dengan akunmu untuk bertanya seputar tradisi, pakaian adat,
                  kuliner, aksara, dan fitur website ini.
                </p>
                <div className="mt-3.5 flex items-center justify-center gap-2">
                  <Link
                    href="/login"
                    className="focus-ring rounded-lg bg-night px-3.5 py-1.5 text-[11.5px] font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Masuk Akun
                  </Link>
                  <Link
                    href="/registrasi"
                    className="focus-ring rounded-lg border border-line bg-cream px-3.5 py-1.5 text-[11.5px] font-medium text-ink transition-colors hover:bg-cream-deep"
                  >
                    Daftar
                  </Link>
                </div>

                <div className="mt-4 border-t border-line/60 pt-3 text-left">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted">
                    Contoh yang bisa kamu tanyakan:
                  </p>
                  <ul className="mt-2 space-y-1 text-[11px] text-ink">
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber">•</span> Apa makna upacara Sekaten?
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber">•</span> Alat musik tradisional dari Sunda?
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="text-amber">•</span> Cara upload foto ke Galeri?
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Pesan Sambutan Ketika Sesi Baru (Belum ada pesan) */}
            {sessionReady && token && messages.length === 0 && !loadingHistory && (
              <div className="rounded-xl border border-dashed border-line bg-paper/80 p-3.5">
                <div className="flex items-center gap-2 text-ink">
                  <SparklesIcon className="h-4 w-4 text-amber" />
                  <p className="font-serif text-[14px] font-medium">
                    Ada yang ingin kamu tanyakan?
                  </p>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                  Tanyakan tradisi daerah, aksara, pakaian adat, makanan khas, atau
                  bantuan navigasi website Budaya Nusantara.
                </p>

                <div className="mt-3 flex flex-col gap-1.5">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void handleSendMessage(suggestion)}
                      className="focus-ring rounded-lg border border-line/70 bg-cream/50 px-2.5 py-1.5 text-left text-[11px] text-ink transition-colors hover:border-amber hover:bg-paper"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Indikator Memuat Riwayat Percakapan */}
            {loadingHistory && (
              <div className="py-4 text-center text-[12px] text-muted">
                Memuat riwayat chat...
              </div>
            )}

            {/* Daftar Balon Pesan */}
            {messages.map((item) => {
              const isUser = item.sender === "user";
              return (
                <div
                  key={item.id}
                  className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-medium ${
                      isUser
                        ? "bg-night text-white"
                        : "bg-cream-deep text-ink"
                    }`}
                  >
                    {isUser ? "K" : "KB"}
                  </span>

                  <div
                    className={`max-w-[82%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed ${
                      isUser
                        ? "rounded-tr-xs bg-night text-[#f6f2e7]"
                        : "rounded-tl-xs border border-line bg-paper text-ink shadow-xs"
                    }`}
                  >
                    <p className="whitespace-pre-line">{item.message}</p>
                    {item.outOfScope && (
                      <p className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-amber">
                        Di luar cakupan
                      </p>
                    )}
                    {item.needsClarification && (
                      <p className="mt-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted">
                        Perlu klarifikasi
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Indikator Sedang Mengetik */}
            {sending && (
              <div className="flex items-center gap-2 text-ink">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream-deep text-[9px] font-medium">
                  KB
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-xs border border-line bg-paper px-3 py-2 text-[11.5px] text-muted shadow-xs">
                  <span aria-hidden="true" className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:300ms]" />
                  </span>
                  <span>Kanca Budaya sedang menulis...</span>
                </div>
              </div>
            )}

            {/* Pesan Kesalahan */}
            {chatError && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-700"
              >
                {chatError}
              </div>
            )}
          </div>

          {/* Bagian Input Form */}
          <div className="border-t border-line bg-paper p-2.5">
            {token ? (
              <form onSubmit={handleFormSubmit} className="space-y-1.5">
                <div className="relative flex items-end rounded-xl border border-line bg-cream/40 focus-within:border-ink/50 focus-within:bg-paper">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tanya Kanca Budaya... (Enter kirim)"
                    disabled={sending}
                    className="max-h-24 min-h-[38px] flex-1 resize-none bg-transparent px-3 py-2 text-[12px] leading-relaxed text-ink placeholder:text-muted focus:outline-hidden disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    aria-label="Kirim pertanyaan"
                    className="m-1 flex h-7 w-7 items-center justify-center rounded-lg bg-night text-white transition-opacity hover:opacity-90 disabled:opacity-30"
                  >
                    <SendIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between px-1 text-[10px] text-muted">
                  <span>AI dapat membuat kekeliruan</span>
                  <span>{input.length}/{MAX_MESSAGE}</span>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-line bg-cream/40 px-3 py-2 text-[11.5px] text-muted">
                <span>Masuk akun untuk mulai bertanya</span>
                <Link
                  href="/login"
                  className="font-medium text-ink underline underline-offset-2 hover:text-amber"
                >
                  Masuk
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

export function FloatingChatbot() {
  return (
    <Suspense fallback={null}>
      <FloatingChatbotContent />
    </Suspense>
  );
}
