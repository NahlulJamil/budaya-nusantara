import type { CulturalCategory } from "@/lib/types";

export type CategorySlug =
  | "tradisi"
  | "baju-adat"
  | "makanan"
  | "alat-musik"
  | "aksara";

export interface CategoryDefinition {
  slug: CategorySlug;
  /** Label lengkap untuk breadcrumb dan judul halaman. */
  label: string;
  /** Label pendek untuk meta kartu. */
  shortLabel: string;
  /** Nilai kategori pada API budaya; `null` berarti memakai endpoint aksara. */
  apiCategory: CulturalCategory | null;
  heading: string;
  description: (provinceName: string) => string;
  searchPlaceholder: (provinceName: string) => string;
}

export const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    slug: "tradisi",
    label: "Tradisi Daerah",
    shortLabel: "Tradisi",
    apiCategory: "tradisi",
    heading: "Tradisi yang hidup di antara kita.",
    description: (provinceName) =>
      `Kenali perayaan, seni pertunjukan, dan keterampilan yang diteruskan lewat praktik sehari-hari di ${provinceName}. Preview dan artikel dapat dibaca tanpa login.`,
    searchPlaceholder: (provinceName) => `Cari tradisi di ${provinceName}...`,
  },
  {
    slug: "baju-adat",
    label: "Baju Adat",
    shortLabel: "Baju Adat",
    apiCategory: "baju_adat",
    heading: "Warisan busana yang menyimpan cerita.",
    description: (provinceName) =>
      `Telusuri pakaian adat ${provinceName}: bahan, makna, dan cara pakainya dalam upacara maupun kehidupan sehari-hari. Preview dan artikel dapat dibaca tanpa login.`,
    searchPlaceholder: (provinceName) => `Cari baju adat di ${provinceName}...`,
  },
  {
    slug: "makanan",
    label: "Makanan Khas",
    shortLabel: "Makanan Khas",
    apiCategory: "makanan",
    heading: "Rasa yang tumbuh dari kekayaan Nusantara.",
    description: (provinceName) =>
      `Jelajahi cita rasa khas ${provinceName}, dari bahan lokal hingga cara penyajian yang diwariskan antargenerasi. Preview dan artikel dapat dibaca tanpa login.`,
    searchPlaceholder: (provinceName) =>
      `Cari makanan khas di ${provinceName}...`,
  },
  {
    slug: "alat-musik",
    label: "Alat Musik",
    shortLabel: "Alat Musik",
    apiCategory: "alat_musik",
    heading: "Nada dan irama dari setiap daerah.",
    description: (provinceName) =>
      `Kenali alat musik tradisional ${provinceName}, bahan pembuatannya, dan cara memainkannya. Preview dan artikel dapat dibaca tanpa login.`,
    searchPlaceholder: (provinceName) =>
      `Cari alat musik di ${provinceName}...`,
  },
  {
    slug: "aksara",
    label: "Aksara",
    shortLabel: "Aksara",
    apiCategory: null,
    heading: "Jejak bahasa yang diwariskan lintas generasi.",
    description: (provinceName) =>
      `Pelajari aksara yang hidup di ${provinceName}, dari bentuk karakter hingga makna di baliknya. Preview dan artikel dapat dibaca tanpa login.`,
    searchPlaceholder: (provinceName) => `Cari aksara di ${provinceName}...`,
  },
];

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CATEGORY_DEFINITIONS.find((category) => category.slug === slug);
}

/** Versi serializable untuk dikirim dari Server Component ke Client Component. */
export interface CategoryView {
  slug: CategorySlug;
  label: string;
  shortLabel: string;
  apiCategory: CulturalCategory | null;
  heading: string;
  description: string;
  searchPlaceholder: string;
}

export function toCategoryView(
  category: CategoryDefinition,
  provinceName: string,
): CategoryView {
  return {
    slug: category.slug,
    label: category.label,
    shortLabel: category.shortLabel,
    apiCategory: category.apiCategory,
    heading: category.heading,
    description: category.description(provinceName),
    searchPlaceholder: category.searchPlaceholder(provinceName),
  };
}
