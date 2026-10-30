import type { Metadata } from "next";
import Link from "next/link";

import { AdminDaerahEditScreen } from "@/components/admin/AdminDaerahEditScreen";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Edit Daerah",
};

export const instant = false;

interface AdminDaerahEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDaerahEditPage({
  params,
}: AdminDaerahEditPageProps) {
  const { id } = await params;
  const parsed = Number(id);
  const daerahId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  return (
    <div className="mx-auto max-w-[1080px]">
      <AdminPageHeader
        eyebrow="Wilayah"
        title="Edit Daerah"
        description="Perbarui nama, provinsi, dan deskripsi daerah. Kolom bertanda bintang wajib diisi."
      >
        <Link
          href="/admin/daerah"
          className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          Kembali ke daftar
        </Link>
      </AdminPageHeader>

      <AdminDaerahEditScreen id={daerahId} />
    </div>
  );
}
