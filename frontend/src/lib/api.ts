import type {
  ApiItemResponse,
  ApiListResponse,
  CulturalCategory,
  CulturalContentDetail,
  CulturalContentSummary,
  GaleriPostSummary,
  HomeCultureCard,
  HomeGalleryItem,
} from "@/lib/types";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

/** Origin Laravel, dipakai untuk path media relatif (mis. `galeri/foto.jpg`). */
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

export const CATEGORY_LABELS: Record<CulturalCategory, string> = {
  tradisi: "Tradisi",
  baju_adat: "Pakaian Adat",
  makanan: "Makanan",
  alat_musik: "Alat Musik",
};

const REQUEST_TIMEOUT_MS = 8000;

async function apiGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API ${path} merespons ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/** Ubah path media backend menjadi URL absolut yang bisa dipakai browser. */
export function resolveMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl) {
    return null;
  }

  const value = pathOrUrl.trim();

  if (/^https?:\/\//i.test(value) || value.startsWith("//")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }

  return `${API_ORIGIN}/storage/${value.replace(/^storage\//, "")}`;
}

function plainText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
}

const PREFERRED_CATEGORIES: CulturalCategory[] = [
  "tradisi",
  "makanan",
  "alat_musik",
];

/** Pilih satu konten per kategori utama agar komposisi Home beragam. */
function pickVaried(items: CulturalContentSummary[]): CulturalContentSummary[] {
  const picked: CulturalContentSummary[] = [];

  for (const category of PREFERRED_CATEGORIES) {
    const match = items.find((item) => item.category === category);
    if (match) {
      picked.push(match);
    }
  }

  for (const item of items) {
    if (picked.length >= 3) {
      break;
    }
    if (!picked.some((entry) => entry.id === item.id)) {
      picked.push(item);
    }
  }

  return picked.slice(0, 3);
}

export async function fetchHomeCultureCards(): Promise<HomeCultureCard[]> {
  const list = await apiGet<ApiListResponse<CulturalContentSummary>>(
    "/budaya?per_page=12",
  );
  const picked = pickVaried(list.data ?? []);

  if (picked.length === 0) {
    return [];
  }

  const details = await Promise.allSettled(
    picked.map((item) =>
      apiGet<ApiItemResponse<CulturalContentDetail>>(`/budaya/${item.id}`),
    ),
  );

  return picked.map((item, index) => {
    const detail =
      details[index]?.status === "fulfilled" ? details[index].value.data : null;

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      region: item.daerah?.provinsi ?? item.daerah?.nama ?? null,
      description: plainText(detail?.description),
      image: resolveMediaUrl(item.main_image),
      href: `/budaya/${item.id}`,
    };
  });
}

export async function fetchHomeGallery(): Promise<HomeGalleryItem[]> {
  const list = await apiGet<ApiListResponse<GaleriPostSummary>>(
    "/galeri?per_page=6",
  );

  return (list.data ?? [])
    .flatMap((post): HomeGalleryItem[] => {
      const firstMedia = post.media?.[0];
      const image = resolveMediaUrl(firstMedia?.url ?? firstMedia?.file_path);

      return image
        ? [
            {
              id: post.id,
              title: post.title,
              image,
              href: "/galeri",
            },
          ]
        : [];
    })
    .slice(0, 3);
}
