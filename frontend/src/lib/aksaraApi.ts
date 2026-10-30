import { API_BASE_URL } from "@/lib/api";
import type { DaerahSummary, PaginationMeta } from "@/lib/types";

const REQUEST_TIMEOUT_MS = 10000;
const PER_PAGE = 50;
const MAX_PAGES = 20;

export interface AksaraSummary {
  id: number;
  name: string;
  description: string | null;
  main_image: string | null;
  daerah: DaerahSummary | null;
}

export interface AksaraCharacterItem {
  id: number;
  character: string;
  latin: string | null;
  description: string | null;
  image: string | null;
}

export interface AksaraCategoryItem {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  characters: AksaraCharacterItem[];
}

export interface AksaraDetail extends AksaraSummary {
  description: string | null;
  history: string | null;
  categories: AksaraCategoryItem[];
}

export interface QuizQuestionItem {
  id: number;
  question: string;
  displayed_character: string;
}

export interface QuizAnswerData {
  attempt: {
    id: number;
    user_answer: string | null;
    is_correct: boolean | null;
    answered_at: string | null;
  };
  correct_answer: string | null;
  explanation: string | null;
}

interface AksaraListResponse {
  message: string;
  data: AksaraSummary[];
  meta: PaginationMeta;
}

interface AksaraDetailResponse {
  message: string;
  data: AksaraDetail;
}

interface QuizQuestionsResponse {
  message: string;
  data: {
    aksara: { id: number; name: string };
    soal: QuizQuestionItem[];
  };
  meta: PaginationMeta;
}

export class AksaraApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "AksaraApiError";
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
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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

      throw new AksaraApiError(
        typeof data.message === "string"
          ? data.message
          : `Permintaan gagal (${response.status}).`,
        response.status,
        parseErrors(data.errors),
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof AksaraApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AksaraApiError(
        "Permintaan ke server melebihi batas waktu. Coba lagi.",
        0,
      );
    }

    throw new AksaraApiError(
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Ambil seluruh daftar aksara (mengikuti pagination backend). */
export async function fetchAksaraList(): Promise<AksaraSummary[]> {
  const items: AksaraSummary[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const response = await request<AksaraListResponse>(
      `/aksara?per_page=${PER_PAGE}&page=${page}`,
    );

    items.push(...response.data);
    lastPage = response.meta.last_page;
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return items;
}

export interface AksaraListParams {
  q?: string;
  provinsi?: string;
  daerahId?: number | null;
  page?: number;
  perPage?: number;
}

export interface AksaraListResult {
  items: AksaraSummary[];
  meta: PaginationMeta;
}

/** Ambil satu halaman daftar aksara dengan filter provinsi, daerah, dan pencarian. */
export async function fetchAksaraPage(
  params: AksaraListParams = {},
): Promise<AksaraListResult> {
  const query = new URLSearchParams();
  const keyword = params.q?.trim();

  if (keyword) {
    query.set("q", keyword);
  }

  const provinsi = params.provinsi?.trim();
  if (provinsi) {
    query.set("provinsi", provinsi);
  }

  if (params.daerahId) {
    query.set("daerah_id", String(params.daerahId));
  }

  query.set("per_page", String(params.perPage ?? 9));

  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }

  const response = await request<AksaraListResponse>(
    `/aksara?${query.toString()}`,
  );

  return { items: response.data ?? [], meta: response.meta };
}

export async function fetchAksaraDetail(id: number): Promise<AksaraDetail> {
  const response = await request<AksaraDetailResponse>(`/aksara/${id}`);

  return response.data;
}

export interface AksaraQuiz {
  aksara: { id: number; name: string };
  questions: QuizQuestionItem[];
}

/** Ambil seluruh soal kuis sebuah aksara (mengikuti pagination backend). */
export async function fetchAksaraQuiz(aksaraId: number): Promise<AksaraQuiz> {
  const questions: QuizQuestionItem[] = [];
  let aksara: { id: number; name: string } = {
    id: aksaraId,
    name: "",
  };
  let page = 1;
  let lastPage = 1;

  do {
    const response = await request<QuizQuestionsResponse>(
      `/aksara/${aksaraId}/kuis?per_page=${PER_PAGE}&page=${page}`,
    );

    aksara = response.data.aksara;
    questions.push(...response.data.soal);
    lastPage = response.meta.last_page;
    page += 1;
  } while (page <= lastPage && page <= MAX_PAGES);

  return { aksara, questions };
}

export async function answerQuiz(
  questionId: number,
  userAnswer: string,
  token: string,
): Promise<QuizAnswerData> {
  const response = await request<{ message: string; data: QuizAnswerData }>(
    `/kuis/${questionId}/jawab`,
    {
      method: "POST",
      token,
      body: { user_answer: userAnswer },
    },
  );

  return response.data;
}
