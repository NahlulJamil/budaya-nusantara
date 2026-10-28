import type { Metadata } from "next";
import Link from "next/link";

import { AdminBudayaEditScreen } from "@/components/admin/AdminBudayaEditScreen";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Edit Budaya",
};

export const instant = false;

interface AdminBudayaEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBudayaEditPage({
  params,
}: AdminBudayaEditPageProps) {
  const { id } = await params;
  const parsed = Number(id);
  const contentId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  return (
    <div className="mx-auto max-w-[1080px]">
      <AdminPageHeader
        eyebrow="Konten"
        title="Edit Budaya"
        description="Perbarui data utama dan detail kategori konten budaya. Kolom bertanda bintang wajib diisi."
      >
        <Link
          href="/admin/budaya"
          className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
        >
          ← Kembali ke daftar
        </Link>
      </AdminPageHeader>

      <AdminBudayaEditScreen id={contentId} />
    </div>
  );
}
