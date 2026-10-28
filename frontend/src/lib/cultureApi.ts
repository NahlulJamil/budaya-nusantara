import { API_BASE_URL } from "@/lib/api";
import type { CulturalCategory, PaginationMeta } from "@/lib/types";

const REQUEST_TIMEOUT_MS = 10000;

export const CULTURE_CATEGORIES: CulturalCategory[] = [
  "tradisi",
  "baju_adat",
  "makanan",
  "alat_musik",
];

export interface CultureDaerah {
  id: number;
  nama: string;
  provinsi: string | null;
}

export interface CultureVariant {
  id: number;
  gender: string;
  avatar_image: string | null;
  description: string | null;
}

export interface CultureInteractiveAsset {
  id: number;
  name: string;
  asset_type: string;
  asset_path: string;
  is_active: boolean;
}

/** Bentuk `detail` per kategori; hanya field kategori terkait yang terisi. */
export interface CultureDetailPayload {
  process?: string | null;
  values?: string | null;
  implementation_time?: string | null;
  jenis_tradisi?: { id: number; nama: string } | null;
  usage?: string | null;
  variants?: CultureVariant[];
  ingredients?: string | null;
  recipe?: string | null;
  serving_method?: string | null;
  material?: string | null;
  how_to_play?: string | null;
  function?: string | null;
  audio?: string | null;
  interactive_asset?: CultureInteractiveAsset | null;
}

export interface CultureSource {
  id: number;
  title: string;
  source_url: string | null;
  author: string | null;
  description: string | null;
}

export interface CultureListItem {
  id: number;
  category: CulturalCategory;
  title: string;
  main_image: string | null;
  daerah: CultureDaerah | null;
  detail: CultureDetailPayload | null;
}

export interface CultureDetailItem extends CultureListItem {
  description: string | null;
  history: string | null;
  meaning: string | null;
  sources: CultureSource[];
}

export interface CultureListParams {
  category?: CulturalCategory | null;
  q?: string;
  page?: number;
  perPage?: number;
}

export interface CultureListResult {
  items: CultureListItem[];
  meta: PaginationMeta;
}

interface CultureListResponse {
  message: string;
  data: CultureListItem[];
  meta: PaginationMeta;
}

export class CultureApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CultureApiError";
    this.status = status;
  }
}

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
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

      throw new CultureApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof CultureApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new CultureApiError(
        "Permintaan ke server melebihi batas waktu. Coba lagi.",
        0,
      );
    }

    throw new CultureApiError(
      "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.",
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCultureList(
  params: CultureListParams = {},
): Promise<CultureListResult> {
  const query = new URLSearchParams();
  const keyword = params.q?.trim();

  if (keyword) {
    query.set("q", keyword);
  }

  query.set("per_page", String(params.perPage ?? 9));

  if (params.page && params.page > 1) {
    query.set("page", String(params.page));
  }

  // Backend menyediakan endpoint kategori terpisah dengan filter yang sama.
  const path = params.category
    ? `/kategori/${params.category}`
    : "/budaya";

  const response = await request<CultureListResponse>(
    `${path}?${query.toString()}`,
  );

  return { items: response.data ?? [], meta: response.meta };
}

export async function fetchCultureDetail(
  id: number,
): Promise<CultureDetailItem> {
  const response = await request<{
    message: string;
    data: CultureDetailItem;
  }>(`/budaya/${id}`);

  return response.data;
}
