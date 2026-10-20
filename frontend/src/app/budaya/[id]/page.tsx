import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const instant = false;

interface CultureDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CultureDetailPage({
  params,
}: CultureDetailPageProps) {
  const { id } = await params;

  return (
    <PlaceholderPage
      title="Detail Budaya"
      description="Halaman detail budaya akan menampilkan cerita, galeri, dan sumber dari konten yang kamu pilih."
      detail={`Konten dengan ID “${id}” belum ditampilkan karena halaman detail belum dibangun pada tahap ini.`}
    />
  );
}
