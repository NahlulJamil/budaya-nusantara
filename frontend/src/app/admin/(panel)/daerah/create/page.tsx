import type { Metadata } from "next";
import Link from "next/link";

import { AdminDaerahForm } from "@/components/admin/AdminDaerahForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Tambah Daerah",
};

export const instant = false;

interface AdminDaerahCreatePageProps {
  searchParams: Promise<{ provinsi?: string | string[]; nama?: string | string[] }>;
}

export default async function AdminDaerahCreatePage({
  searchParams,
}: AdminDaerahCreatePageProps) {
  const { provinsi, nama } = await searchParams;
  const initialProvinsi =
    typeof provinsi === "string" ? provinsi.trim() : "";
  const initialNama = typeof nama === "string" ? nama.trim() : undefined;

  return (
    <div className="mx-auto max-w-[1080px]">
      <AdminPageHeader
        eyebrow="Wilayah"
        title="Tambah Daerah"
        description="Buat daerah baru dan hubungkan dengan provinsi asalnya. Kolom bertanda bintang wajib diisi."
      >
        <Link
          href="/admin/daerah"
          className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          Kembali ke daftar
        </Link>
      </AdminPageHeader>

      <AdminDaerahForm
        initialProvinsi={initialProvinsi}
        initialNama={initialNama}
      />
    </div>
  );
}
