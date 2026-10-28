import { API_BASE_URL } from "@/lib/api";
import type { PaginationMeta } from "@/lib/types";

const LIST_TIMEOUT_MS = 10000;
const MESSAGE_TIMEOUT_MS = 60000;

export type ChatSender = "user" | "assistant";

export interface ChatMessageItem {
  id: number;
  sender: ChatSender;
  message: string;
  created_at: string | null;
}

export interface ChatSessionContent {
  id: number;
  title: string;
  category?: string;
}

export interface ChatSessionListItem {
  id: number;
  messages_count: number;
  updated_at: string;
  current_content: ChatSessionContent | null;
}

export interface ChatSessionDetail {
  id: number;
  current_content: { id: number; title: string } | null;
  messages: ChatMessageItem[];
}

export interface ChatSendResult {
  session: { id: number; current_content_id: number | null };
  user_message: { id: number; message: string };
  reply: { id: number; message: string };
  out_of_scope?: boolean;
  needs_clarification?: boolean;
}

export interface ChatContentContext {
  id: number;
  title: string;
  category?: string;
}

export class ChatbotApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ChatbotApiError";
    this.status = status;
    this.errors = errors;
  }
}

function parseErrors(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string[]] =>
        Array.isArray(entry[1]) &&
        entry[1].every((item) => typeof item === "string"),
    ),
  );
}

interface RequestOptions {
  method?: "GET" | "POST";
  token?: string | null;
  body?: unknown;
  timeoutMs?: number;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? LIST_TIMEOUT_MS,
  );

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const data =
        payload && typeof payload === "object"
          ? (payload as { message?: unknown; errors?: unknown })
          : {};

      throw new ChatbotApiError(
        typeof data.message === "string"
          ? data.message
          : `Permintaan gagal (${response.status}).`,
        response.status,
        parseErrors(data.errors),
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ChatbotApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ChatbotApiError(
        "Permintaan melebihi batas waktu. Periksa koneksi lalu coba lagi.",
        0,
      );
    }

    throw new ChatbotApiError(
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchChatSessions(
  token: string,
  perPage = 20,
): Promise<{ data: ChatSessionListItem[]; meta: PaginationMeta }> {
  return request<{ message: string; data: ChatSessionListItem[]; meta: PaginationMeta }>(
    `/chatbot/sessions?per_page=${perPage}`,
    { token },
  );
}

export async function fetchChatSession(
  token: string,
  id: number,
): Promise<ChatSessionDetail> {
  const response = await request<{ message: string; data: ChatSessionDetail }>(
    `/chatbot/sessions/${id}`,
    { token },
  );

  return response.data;
}

/** Ambil judul konten published untuk konteks halaman (endpoint publik). */
export async function fetchContentContext(
  id: number,
): Promise<ChatContentContext> {
  const response = await request<{ data: ChatContentContext }>(`/budaya/${id}`, {
    timeoutMs: LIST_TIMEOUT_MS,
  });

  return response.data;
}

export async function sendChatMessage(
  token: string,
  payload: {
    message: string;
    sessionId?: number | null;
    currentContentId?: number | null;
  },
): Promise<ChatSendResult> {
  const body: Record<string, unknown> = { message: payload.message };

  if (payload.sessionId !== undefined && payload.sessionId !== null) {
    body.session_id = payload.sessionId;
  }

  // `null` dikirim eksplisit agar backend benar-benar mengosongkan konteks sesi.
  if (payload.currentContentId !== undefined) {
    body.current_content_id = payload.currentContentId;
  }

  const response = await request<{ message: string; data: ChatSendResult }>(
    "/chatbot/message",
    {
      method: "POST",
      token,
      body,
      timeoutMs: MESSAGE_TIMEOUT_MS,
    },
  );

  return response.data;
}
