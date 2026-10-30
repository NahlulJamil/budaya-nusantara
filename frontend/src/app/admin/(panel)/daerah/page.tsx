import type { Metadata } from "next";
import Link from "next/link";

import { AdminDaerahList } from "@/components/admin/AdminDaerahList";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PlusIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Kelola Provinsi",
};

export const instant = false;

export default function AdminDaerahPage() {
  return (
    <div className="mx-auto max-w-[1080px]">
      <AdminPageHeader
        eyebrow="Wilayah"
        title="Kelola Provinsi"
        description="Kumpulan 38 provinsi Indonesia. Tambah provinsi atau kelola daerah yang menghubungkan konten budaya dan aksara dengan wilayahnya."
      >
        <Link
          href="/admin/daerah/create"
          className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
        >
          <PlusIcon className="h-4 w-4" />
          Tambah Provinsi
        </Link>
      </AdminPageHeader>

      <AdminDaerahList />
    </div>
  );
}
