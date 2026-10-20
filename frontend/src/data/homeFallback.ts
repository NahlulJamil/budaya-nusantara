import type { HomeCultureCard, HomeGalleryItem } from "@/lib/types";

/**
 * Pratinjau kuratif HANYA dipakai ketika API belum mengembalikan konten
 * published (mis. database masih kosong atau backend belum berjalan).
 * Data ini tidak pernah menggantikan respons API yang valid dan selalu
 * ditandai di UI lewat `PreviewNote`.
 */
export const FALLBACK_CULTURE_CARDS: HomeCultureCard[] = [
  {
    id: "preview-sekaten",
    title: "Sekaten",
    category: "tradisi",
    region: "Jawa Tengah",
    description:
      "Mengenal perayaan Maulid Nabi dan peran gamelan dalam tradisi keraton Surakarta.",
    image: "/images/sekaten.jpg",
    href: "/budaya/preview-sekaten",
  },
  {
    id: "preview-tinutuan",
    title: "Tinutuan",
    category: "makanan",
    region: "Sulawesi Utara",
    description:
      "Bubur Manado adalah sepinggan kehangatan dari tanah Sulawesi Utara.",
    image: "/images/tinutuan.jpg",
    href: "/budaya/preview-tinutuan",
  },
  {
    id: "preview-angklung",
    title: "Angklung",
    category: "alat_musik",
    region: "Jawa Barat",
    description:
      "Harmoni bambu yang mengalun dalam irama kebersamaan.",
    image: "/images/angklung.jpg",
    href: "/budaya/preview-angklung",
  },
];

export const FALLBACK_GALLERY: HomeGalleryItem[] = [
  {
    id: "preview-galeri-bali",
    title: "Penari Bali",
    image: "/images/galeri-bali.jpg",
    href: "/galeri",
  },
  {
    id: "preview-galeri-rumah-gadang",
    title: "Rumah Gadang, Sumatra Barat",
    image: "/images/galeri-rumah-gadang.jpg",
    href: "/galeri",
  },
  {
    id: "preview-galeri-kuliner",
    title: "Randang Jariang",
    image: "/images/galeri-kuliner.jpg",
    href: "/galeri",
  },
];
