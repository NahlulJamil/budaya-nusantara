import type { Metadata } from "next";
import Link from "next/link";

import { AdminBudayaCreateForm } from "@/components/admin/AdminBudayaCreateForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Tambah Budaya",
};

export default function AdminBudayaCreatePage() {
  return (
    <div className="mx-auto max-w-[1080px]">
      <AdminPageHeader
        eyebrow="Konten"
        title="Tambah Budaya"
        description="Buat konten budaya baru beserta detail kategorinya. Kolom bertanda bintang wajib diisi."
      >
        <Link
          href="/admin/budaya"
          className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          ← Kembali ke daftar
        </Link>
      </AdminPageHeader>

      <AdminBudayaCreateForm />
    </div>
  );
}
