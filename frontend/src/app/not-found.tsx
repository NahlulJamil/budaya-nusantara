import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { PublicChrome } from "@/components/layout/PublicChrome";

export default function NotFound() {
  return (
    <PublicChrome>
      <PlaceholderPage
        eyebrow="404"
        title="Halaman tidak ditemukan"
        description="Alamat yang kamu buka belum tersedia. Kembali ke Home untuk mulai menjelajah budaya Indonesia."
      />
    </PublicChrome>
  );
}
