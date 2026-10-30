import { notFound } from "next/navigation";

import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

/**
 * Route placeholder membaca `params` runtime, jadi sengaja dibuat blocking
 * (bukan prerender) sesuai mekanisme cacheComponents Next 16.
 */
export const instant = false;

interface SectionPageProps {
  params: Promise<{ section: string }>;
}

const SECTIONS: Record<
  string,
  { title: string; description: string; eyebrow?: string }
> = {
  tentang: {
    title: "Tentang Kami",
    description:
      "Halaman tentang ruang budaya sedang disiapkan. Beberapa cerita pengantar sudah bisa dibaca di Home.",
  },
  "panduan-kontribusi": {
    title: "Panduan Kontribusi",
    description:
      "Panduan lengkap untuk mengunggah dokumentasi budaya akan tersedia bersama fitur galeri.",
  },
  privasi: {
    title: "Privasi",
    description:
      "Kebijakan privasi akan dipublikasikan sebelum fitur akun dan unggahan dibuka.",
  },
  ketentuan: {
    title: "Ketentuan Penggunaan",
    description:
      "Ketentuan penggunaan akan dipublikasikan sebelum fitur akun dan unggahan dibuka.",
  },
};

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const page = SECTIONS[section];

  if (!page) {
    notFound();
  }

  return (
    <PlaceholderPage
      title={page.title}
      description={page.description}
      eyebrow={page.eyebrow}
    />
  );
}
