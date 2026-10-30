export type CulturalCategory =
  | "tradisi"
  | "baju_adat"
  | "makanan"
  | "alat_musik";

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ApiListResponse<T> {
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiItemResponse<T> {
  message: string;
  data: T;
}

export interface DaerahSummary {
  id: number;
  nama: string;
  provinsi: string | null;
}

export interface CulturalContentSummary {
  id: number;
  category: CulturalCategory;
  title: string;
  main_image: string | null;
  daerah: DaerahSummary | null;
  detail: Record<string, unknown> | null;
}

export interface CulturalContentDetail extends CulturalContentSummary {
  description: string | null;
  history: string | null;
  meaning: string | null;
}

export interface GaleriMedia {
  id: number;
  file_path: string;
  media_type: string;
  url: string;
}

export interface GaleriPostSummary {
  id: number;
  title: string;
  caption: string | null;
  location: string | null;
  activity_date: string | null;
  status: "pending" | "approved" | "rejected";
  created_at?: string | null;
  author: { id: number; username: string } | null;
  content: { id: number; title: string; category: CulturalCategory } | null;
  media: GaleriMedia[];
}

export interface HomeCultureCard {
  id: number | string;
  title: string;
  category: CulturalCategory;
  region: string | null;
  description: string | null;
  image: string | null;
  href: string;
}

export interface HomeGalleryItem {
  id: number | string;
  title: string;
  image: string;
  href: string;
}
