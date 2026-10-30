import { API_BASE_URL } from "@/lib/api";
import type {
  CulturalContentSummary,
  GaleriPostSummary,
  PaginationMeta,
} from "@/lib/types";

const USER_TOKEN_KEY = "galeribudaya.user.token";
const REQUEST_TIMEOUT_MS = 10000;
const UPLOAD_TIMEOUT_MS = 30000;

export function readUserToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const persistent = window.localStorage.getItem(USER_TOKEN_KEY);
    if (persistent) {
      return persistent;
    }
  } catch {
    // Lanjut ke sessionStorage bila localStorage tidak tersedia.
  }
  try {
    return window.sessionStorage.getItem(USER_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Menyimpan token sesi. `remember` memakai localStorage agar sesi bertahan
 * setelah tab ditutup; tanpa itu token hanya hidup selama tab aktif.
 */
export function writeUserToken(token: string, remember = false): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (remember) {
      window.localStorage.setItem(USER_TOKEN_KEY, token);
      window.sessionStorage.removeItem(USER_TOKEN_KEY);
    } else {
      window.sessionStorage.setItem(USER_TOKEN_KEY, token);
      window.localStorage.removeItem(USER_TOKEN_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

export function clearUserToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(USER_TOKEN_KEY);
  } catch {
    // Abaikan: tidak ada yang bisa dilakukan.
  }
  try {
    window.sessionStorage.removeItem(USER_TOKEN_KEY);
  } catch {
    // Abaikan: tidak ada yang bisa dilakukan.
  }
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at?: string | null;
}

export interface UserLoginResponse {
  message: string;
  data: { token: string; user: UserSummary };
}

export interface UserRegisterResponse {
  message: string;
  data: { token: string; token_type: string; user: UserSummary };
}

export interface UserMeResponse {
  message: string;
  data: { user: UserSummary };
}

export interface GaleriListResponse {
  message: string;
  data: GaleriPostSummary[];
  meta: PaginationMeta;
}

export interface GaleriUploadPayload {
  title: string;
  content_id: number;
  caption?: string;
  location?: string;
  activity_date?: string;
  media: File[];
}

export class UserApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "UserApiError";
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
  method?: "GET" | "POST" | "PATCH";
  token?: string | null;
  body?: unknown;
  timeoutMs?: number;
}

async function userRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? REQUEST_TIMEOUT_MS,
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

      throw new UserApiError(
        typeof data.message === "string"
          ? data.message
          : `Permintaan gagal (${response.status}).`,
        response.status,
        parseErrors(data.errors),
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof UserApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UserApiError(
        "Permintaan ke server melebihi batas waktu. Coba lagi.",
        0,
      );
    }

    throw new UserApiError(
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<UserRegisterResponse> {
  return userRequest<UserRegisterResponse>("/register", {
    method: "POST",
    body: {
      username,
      email,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
}

export async function loginUser(
  email: string,
  password: string,
): Promise<UserLoginResponse> {
  return userRequest<UserLoginResponse>("/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function fetchUserMe(token: string): Promise<UserMeResponse> {
  return userRequest<UserMeResponse>("/me", { token });
}

export async function updateUserProfile(
  token: string,
  username: string,
): Promise<UserMeResponse> {
  return userRequest<UserMeResponse>("/me", {
    method: "PATCH",
    token,
    body: { username },
  });
}

export async function fetchMyGaleri(
  token: string,
  params: { per_page?: number; page?: number } = {},
): Promise<GaleriListResponse> {
  const query = new URLSearchParams();
  if (params.per_page) {
    query.set("per_page", String(params.per_page));
  }
  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return userRequest<GaleriListResponse>(`/galeri-saya${suffix}`, { token });
}

export async function logoutUser(token: string): Promise<void> {
  await userRequest("/logout", { method: "POST", token });
}

export async function fetchGaleriList(params: {
  content_id?: number;
  per_page?: number;
  page?: number;
}): Promise<GaleriListResponse> {
  const query = new URLSearchParams();
  if (params.content_id) {
    query.set("content_id", String(params.content_id));
  }
  if (params.per_page) {
    query.set("per_page", String(params.per_page));
  }
  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";

  return userRequest<GaleriListResponse>(`/galeri${suffix}`);
}

export async function fetchPublishedContents(): Promise<
  CulturalContentSummary[]
> {
  const response = await userRequest<{ data: CulturalContentSummary[] }>(
    "/budaya?per_page=50",
  );

  return response.data ?? [];
}

export async function uploadGaleri(
  token: string,
  payload: GaleriUploadPayload,
): Promise<{ message: string; data: GaleriPostSummary }> {
  const form = new FormData();
  form.append("title", payload.title);
  form.append("content_id", String(payload.content_id));
  if (payload.caption) {
    form.append("caption", payload.caption);
  }
  if (payload.location) {
    form.append("location", payload.location);
  }
  if (payload.activity_date) {
    form.append("activity_date", payload.activity_date);
  }
  for (const file of payload.media) {
    form.append("media[]", file);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/galeri`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: form,
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      errors?: Record<string, string[]>;
      data?: GaleriPostSummary;
    };

    if (!response.ok) {
      throw new UserApiError(
        data.message ?? `Unggah gagal (${response.status}).`,
        response.status,
        data.errors ?? {},
      );
    }

    return {
      message: data.message ?? "Kiriman berhasil diunggah.",
      data: data.data as GaleriPostSummary,
    };
  } catch (error) {
    if (error instanceof UserApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UserApiError(
        "Unggahan melebihi batas waktu. Coba lagi.",
        0,
      );
    }

    throw new UserApiError(
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function reportGaleri(
  token: string,
  id: number,
  reason: string,
  description?: string,
): Promise<{ message: string }> {
  return userRequest<{ message: string }>(`/galeri/${id}/laporkan`, {
    method: "POST",
    token,
    body: { reason, description },
  });
}
