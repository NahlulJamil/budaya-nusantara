import { API_BASE_URL } from "@/lib/api";
import type { CulturalCategory, PaginationMeta } from "@/lib/types";

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

export type AdminContentStatus = "draft" | "published";

export interface AdminBudayaListItem {
  id: number;
  category: CulturalCategory;
  title: string;
  status: AdminContentStatus;
  daerah: { id: number; nama: string; provinsi: string | null } | null;
}

export interface AdminDaerahListItem {
  id: number;
  nama: string;
  provinsi: string | null;
  cultural_contents_count: number;
  aksaras_count: number;
}

export interface AdminDaerahListQuery {
  q?: string;
  per_page?: number;
  page?: number;
}

export interface AdminDaerahCreatePayload {
  nama: string;
  provinsi: string;
  deskripsi?: string;
}

export interface AdminDaerahUpdatePayload {
  nama: string;
  provinsi: string;
  deskripsi?: string | null;
}

export interface AdminDaerahDetail {
  id: number;
  nama: string;
  provinsi: string | null;
  deskripsi: string | null;
  cultural_contents_count: number;
  aksaras_count: number;
}

export interface AdminDaerahDetailResponse {
  message: string;
  data: AdminDaerahDetail;
}

export interface AdminDaerahMutationResponse {
  message: string;
  data: {
    id: number;
    nama: string;
  };
}

export interface AdminBudayaListQuery {
  q?: string;
  status?: AdminContentStatus | "";
  provinsi?: string;
  per_page?: number;
  page?: number;
}

export interface AdminBudayaListResponse {
  message: string;
  data: AdminBudayaListItem[];
  meta: PaginationMeta;
}

export interface AdminDaerahListResponse {
  message: string;
  data: AdminDaerahListItem[];
  meta: PaginationMeta;
}

export interface JenisTradisiOption {
  id: number;
  nama: string;
}

export interface JenisTradisiListResponse {
  message: string;
  data: JenisTradisiOption[];
  meta: PaginationMeta;
}

export interface AdminBudayaMutationResponse {
  message: string;
  data: {
    id: number;
    status: AdminContentStatus;
  };
}

export type AdminBudayaVariantGender = "pria" | "wanita";

/** Varian pakaian adat sesuai `detail.variants.*` pada backend. */
export interface AdminBudayaVariantPayload {
  gender: AdminBudayaVariantGender;
  avatar_image?: string;
  description?: string;
}

/**
 * Detail kategori. Hanya field milik kategori yang dipilih yang boleh diisi;
 * backend menyimpan detail berdasarkan `category`.
 */
export interface AdminBudayaDetailPayload {
  jenis_tradisi_id?: number;
  process?: string;
  values?: string;
  implementation_time?: string;
  usage?: string;
  variants?: AdminBudayaVariantPayload[];
  ingredients?: string;
  recipe?: string;
  serving_method?: string;
  material?: string;
  how_to_play?: string;
  function?: string;
  audio?: string | null;
}

/** Payload `POST /api/admin/budaya` sesuai aturan validasi backend. */
export interface AdminBudayaCreatePayload {
  provinsi: string;
  category: CulturalCategory;
  title: string;
  description: string;
  history: string;
  meaning: string;
  main_image?: string;
  status: AdminContentStatus;
  detail?: AdminBudayaDetailPayload;
}

/** Varian pada respons detail (field boleh null). */
export interface AdminBudayaVariantData {
  gender: AdminBudayaVariantGender;
  avatar_image: string | null;
  description: string | null;
}

/** Bentuk `detail` pada respons `GET /api/admin/budaya/{id}`. */
export interface AdminBudayaDetailData {
  jenis_tradisi_id?: number | null;
  process?: string | null;
  values?: string | null;
  implementation_time?: string | null;
  usage?: string | null;
  variants?: AdminBudayaVariantData[];
  ingredients?: string | null;
  recipe?: string | null;
  serving_method?: string | null;
  material?: string | null;
  how_to_play?: string | null;
  function?: string | null;
  audio?: string | null;
  interactive_asset_id?: number | null;
}

export interface AdminBudayaContentDetail {
  id: number;
  category: CulturalCategory;
  title: string;
  description: string | null;
  history: string | null;
  meaning: string | null;
  main_image: string | null;
  status: AdminContentStatus;
  daerah: { id: number; nama: string; provinsi: string | null } | null;
  creator: { id: number; username: string } | null;
  detail: AdminBudayaDetailData | null;
  sources: { id: number; title: string; source_url: string | null }[];
}

export interface AdminBudayaDetailResponse {
  message: string;
  data: AdminBudayaContentDetail;
}

export type AdminMediaPurpose = "image" | "audio";

export interface AdminMediaUploadResponse {
  message: string;
  data: { path: string };
}

/**
 * Payload `PUT /api/admin/budaya/{id}`. Edit mengirim data lengkap;
 * `main_image: null` dipakai untuk mengosongkan gambar.
 */
export interface AdminBudayaUpdatePayload {
  provinsi: string;
  category: CulturalCategory;
  title: string;
  description: string;
  history: string;
  meaning: string;
  main_image: string | null;
  status: AdminContentStatus;
  detail?: AdminBudayaDetailPayload;
}

interface AdminLoginResponse {
  message: string;
  data: {
    user: AdminUser;
    token: string;
    token_type: string;
  };
}

interface AdminMeResponse {
  message: string;
  data: {
    user: AdminUser;
  };
}

interface AdminMessageResponse {
  message: string;
}

export class AdminApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.errors = errors;
  }
}

const ADMIN_REQUEST_TIMEOUT_MS = 10000;
const ADMIN_UPLOAD_TIMEOUT_MS = 60000;
const ADMIN_TOKEN_KEY = "galeribudaya.admin.token";

interface AdminRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string | null;
  body?: unknown;
  formData?: FormData;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function parseErrors(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) &&
      entry[1].every((item) => typeof item === "string"),
  );

  return Object.fromEntries(entries);
}

async function adminRequest<T>(
  path: string,
  options: AdminRequestOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? ADMIN_REQUEST_TIMEOUT_MS,
  );

  const isMultipart = options.formData !== undefined;

  function handleExternalAbort() {
    controller.abort();
  }

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", handleExternalAbort);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(!isMultipart && options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: isMultipart
        ? options.formData
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") ?? "";
    const payload: unknown = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : `Permintaan gagal (${response.status}).`;

      const errors =
        payload && typeof payload === "object" && "errors" in payload
          ? parseErrors(payload.errors)
          : {};

      throw new AdminApiError(message, response.status, errors);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AdminApiError(
        "Permintaan ke server melebihi batas waktu. Coba lagi.",
        0,
      );
    }

    throw new AdminApiError(
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      0,
    );
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", handleExternalAbort);
  }
}

export function readAdminToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeAdminToken(token: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // Sesi tetap dianggap tidak valid dari sisi aplikasi.
  }
}

export function isAdminUser(
  user: AdminUser | null | undefined,
): user is AdminUser & { role: "admin" } {
  return user?.role === "admin";
}

export async function loginAdmin(
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<AdminLoginResponse> {
  return adminRequest<AdminLoginResponse>("/login", {
    method: "POST",
    body: { email, password },
    signal,
  });
}

export async function fetchAdminMe(
  token: string,
  signal?: AbortSignal,
): Promise<AdminMeResponse> {
  return adminRequest<AdminMeResponse>("/me", { token, signal });
}

export async function logoutAdmin(
  token: string,
  signal?: AbortSignal,
): Promise<AdminMessageResponse> {
  return adminRequest<AdminMessageResponse>("/logout", {
    method: "POST",
    token,
    signal,
  });
}

function requireAdminToken(): string {
  const token = readAdminToken();

  if (!token) {
    throw new AdminApiError(
      "Sesi admin tidak ditemukan. Silakan masuk kembali.",
      401,
    );
  }

  return token;
}

export async function fetchAdminBudayaList(
  query: AdminBudayaListQuery = {},
  signal?: AbortSignal,
): Promise<AdminBudayaListResponse> {
  const params = new URLSearchParams();
  const keyword = query.q?.trim();

  if (keyword) {
    params.set("q", keyword);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.provinsi) {
    params.set("provinsi", query.provinsi);
  }

  if (query.per_page) {
    params.set("per_page", String(query.per_page));
  }

  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }

  const search = params.toString();

  return adminRequest<AdminBudayaListResponse>(
    `/admin/budaya${search ? `?${search}` : ""}`,
    { token: requireAdminToken(), signal },
  );
}

export async function fetchAdminDaerahList(
  query: AdminDaerahListQuery = {},
  signal?: AbortSignal,
): Promise<AdminDaerahListResponse> {
  const params = new URLSearchParams();
  const keyword = query.q?.trim();

  if (keyword) {
    params.set("q", keyword);
  }

  if (query.per_page) {
    params.set("per_page", String(query.per_page));
  }

  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }

  const search = params.toString();

  return adminRequest<AdminDaerahListResponse>(
    `/admin/daerah${search ? `?${search}` : ""}`,
    { token: requireAdminToken(), signal },
  );
}

export async function fetchAdminDaerahOptions(
  perPage = 50,
  signal?: AbortSignal,
): Promise<AdminDaerahListResponse> {
  return fetchAdminDaerahList({ per_page: perPage }, signal);
}

export async function fetchAdminDaerahDetail(
  id: number,
  signal?: AbortSignal,
): Promise<AdminDaerahDetailResponse> {
  return adminRequest<AdminDaerahDetailResponse>(`/admin/daerah/${id}`, {
    token: requireAdminToken(),
    signal,
  });
}

export async function createAdminDaerah(
  payload: AdminDaerahCreatePayload,
  signal?: AbortSignal,
): Promise<AdminDaerahMutationResponse> {
  return adminRequest<AdminDaerahMutationResponse>("/admin/daerah", {
    method: "POST",
    token: requireAdminToken(),
    body: payload,
    signal,
  });
}

export async function updateAdminDaerah(
  id: number,
  payload: AdminDaerahUpdatePayload,
  signal?: AbortSignal,
): Promise<AdminDaerahMutationResponse> {
  return adminRequest<AdminDaerahMutationResponse>(`/admin/daerah/${id}`, {
    method: "PUT",
    token: requireAdminToken(),
    body: payload,
    signal,
  });
}

export async function deleteAdminDaerah(
  id: number,
  signal?: AbortSignal,
): Promise<AdminMessageResponse> {
  return adminRequest<AdminMessageResponse>(`/admin/daerah/${id}`, {
    method: "DELETE",
    token: requireAdminToken(),
    signal,
  });
}

export async function updateAdminBudayaStatus(
  id: number,
  status: AdminContentStatus,
  signal?: AbortSignal,
): Promise<AdminBudayaMutationResponse> {
  return adminRequest<AdminBudayaMutationResponse>(`/admin/budaya/${id}`, {
    method: "PATCH",
    token: requireAdminToken(),
    body: { status },
    signal,
  });
}

export async function deleteAdminBudaya(
  id: number,
  signal?: AbortSignal,
): Promise<AdminMessageResponse> {
  return adminRequest<AdminMessageResponse>(`/admin/budaya/${id}`, {
    method: "DELETE",
    token: requireAdminToken(),
    signal,
  });
}

export async function createAdminBudaya(
  payload: AdminBudayaCreatePayload,
  signal?: AbortSignal,
): Promise<AdminBudayaMutationResponse> {
  return adminRequest<AdminBudayaMutationResponse>("/admin/budaya", {
    method: "POST",
    token: requireAdminToken(),
    body: payload,
    signal,
  });
}

export async function fetchAdminBudayaDetail(
  id: number,
  signal?: AbortSignal,
): Promise<AdminBudayaDetailResponse> {
  return adminRequest<AdminBudayaDetailResponse>(`/admin/budaya/${id}`, {
    token: requireAdminToken(),
    signal,
  });
}

export async function fetchJenisTradisiOptions(
  perPage = 50,
  signal?: AbortSignal,
): Promise<JenisTradisiListResponse> {
  const params = new URLSearchParams({ per_page: String(perPage) });

  return adminRequest<JenisTradisiListResponse>(
    `/jenis-tradisi?${params.toString()}`,
    { token: requireAdminToken(), signal },
  );
}

export async function updateAdminBudaya(
  id: number,
  payload: AdminBudayaUpdatePayload,
  signal?: AbortSignal,
): Promise<AdminBudayaMutationResponse> {
  return adminRequest<AdminBudayaMutationResponse>(`/admin/budaya/${id}`, {
    method: "PUT",
    token: requireAdminToken(),
    body: payload,
    signal,
  });
}

export async function uploadAdminMedia(
  file: File,
  purpose: AdminMediaPurpose,
  signal?: AbortSignal,
): Promise<AdminMediaUploadResponse> {
  const formData = new FormData();
  formData.append("purpose", purpose);
  formData.append("file", file);

  return adminRequest<AdminMediaUploadResponse>("/admin/media", {
    method: "POST",
    token: requireAdminToken(),
    formData,
    timeoutMs: ADMIN_UPLOAD_TIMEOUT_MS,
    signal,
  });
}
