import type { Metadata } from "next";
import Link from "next/link";

import { AdminBudayaList } from "@/components/admin/AdminBudayaList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PlusIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Kelola Budaya",
};

export default function AdminBudayaPage() {
  return (
    <div className="mx-auto max-w-[1080px]">
      <AdminPageHeader
        eyebrow="Konten"
        title="Kelola Budaya"
        description="Cari, filter, ubah status terbit, dan hapus konten tradisi, pakaian adat, makanan daerah, serta alat musik."
      >
        <Link
          href="/admin/budaya/create"
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Budaya
        </Link>
      </AdminPageHeader>

      <AdminBudayaList />
    </div>
  );
}
