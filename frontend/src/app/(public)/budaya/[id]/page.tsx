import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CultureDetailScreen } from "@/components/budaya/CultureDetailScreen";

export const instant = false;

export const metadata: Metadata = {
  title: "Detail Budaya",
  description:
    "Detail konten budaya Indonesia: deskripsi, sejarah, makna, informasi kategori, dan sumber.",
};

interface CultureDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CultureDetailPage({
  params,
}: CultureDetailPageProps) {
  const { id } = await params;
  const cultureId = Number(id);

  if (!Number.isInteger(cultureId) || cultureId < 1) {
    notFound();
  }

  return <CultureDetailScreen cultureId={cultureId} />;
}
