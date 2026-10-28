import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AksaraDetailScreen } from "@/components/aksara/AksaraDetailScreen";

export const instant = false;

export const metadata: Metadata = {
  title: "Detail Aksara",
  description:
    "Materi aksara daerah: kategori, karakter, bacaan Latin, dan penjelasannya.",
};

interface AksaraDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AksaraDetailPage({
  params,
}: AksaraDetailPageProps) {
  const { id } = await params;
  const aksaraId = Number(id);

  if (!Number.isInteger(aksaraId) || aksaraId < 1) {
    notFound();
  }

  return <AksaraDetailScreen aksaraId={aksaraId} />;
}
